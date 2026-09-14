from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import get_db
from models import Book, Member
from schemas import MemberCreate, LoginRequest
from auth import hash_password, verify_password, create_access_token, require_librarian
from datetime import datetime, timedelta
from models import Book, Member, Transaction
from schemas import MemberCreate, LoginRequest, IssueRequest, ReturnRequest, BookCreate, BookUpdate, MemberStatusUpdate, RecommendRequest
from typing import Optional
from auth import hash_password, verify_password, create_access_token, require_librarian
from recommend import recommend_books

app = FastAPI(title="Biblioteq")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ROLE_LIMITS = {
    "student": {"max_books": 5, "due_days": 180},
    "faculty": {"max_books": 8, "due_days": 180},
}

@app.get("/")
def read_root():
    return {"message": "Biblioteq API is running"}


@app.get("/books")
def get_books(
    title: Optional[str] = None,
    genre: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Book)

    if title:
        query = query.filter(Book.title.ilike(f"%{title}%"))

    if genre:
        query = query.filter(Book.genre.ilike(genre))

    books = query.all()
    return books


@app.get("/books/{book_id}")
def get_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.book_id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book


@app.post("/register")
def register_member(member: MemberCreate, db: Session = Depends(get_db)):
    if member.role not in ["student", "faculty"]:
        raise HTTPException(status_code=400, detail="Public registration only allowed for student or faculty")

    existing = db.query(Member).filter(Member.email == member.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_member = Member(
        name=member.name,
        email=member.email,
        password_hash=hash_password(member.password),
        phone=member.phone,
        role=member.role,
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)

    return {"message": "Registered successfully", "member_id": new_member.member_id}

@app.post("/login")
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    member = db.query(Member).filter(Member.email == credentials.email).first()

    if not member or not verify_password(credentials.password, member.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not member.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    member.last_login = datetime.now()
    db.commit()

    token = create_access_token({"member_id": member.member_id, "role": member.role})

    return {
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
        "member_id": member.member_id,
        "name": member.name,
        "role": member.role,
    }
    


@app.post("/issue")
def issue_book(request: IssueRequest, db: Session = Depends(get_db)):
    member = db.query(Member).filter(Member.member_id == request.member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    if not member.is_active:
        raise HTTPException(status_code=403, detail="Member account is disabled")

    book = db.query(Book).filter(Book.book_id == request.book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    if book.available_copies <= 0:
        raise HTTPException(status_code=400, detail="No copies available")

    limits = ROLE_LIMITS.get(member.role)
    if not limits:
        raise HTTPException(status_code=403, detail="This role cannot issue books")

    current_issued = db.query(Transaction).filter(
        Transaction.member_id == member.member_id,
        Transaction.status == "issued"
    ).count()

    if current_issued >= limits["max_books"]:
        raise HTTPException(status_code=400, detail=f"Issue limit reached ({limits['max_books']} books)")

    due_date = datetime.now() + timedelta(days=limits["due_days"])

    new_transaction = Transaction(
        book_id=book.book_id,
        member_id=member.member_id,
        due_date=due_date,
        status="issued",
    )
    book.available_copies -= 1

    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)

    return {
        "message": "Book issued successfully",
        "transaction_id": new_transaction.transaction_id,
        "due_date": due_date,
    }

@app.post("/return")
def return_book(request: ReturnRequest, db: Session = Depends(get_db)):
    transaction = db.query(Transaction).filter(
        Transaction.member_id == request.member_id,
        Transaction.book_id == request.book_id,
        Transaction.status == "issued"
    ).first()

    if not transaction:
        raise HTTPException(status_code=404, detail="No active issue found for this member and book")

    now = datetime.now()
    transaction.return_date = now
    transaction.status = "returned"

    if now > transaction.due_date:
        days_late = (now - transaction.due_date).days
        transaction.fine_amount = days_late * 5  # Rs. 5 per day late, adjust as needed
    else:
        transaction.fine_amount = 0

    book = db.query(Book).filter(Book.book_id == request.book_id).first()
    book.available_copies += 1

    db.commit()
    db.refresh(transaction)

    return {
        "message": "Book returned successfully",
        "fine_amount": transaction.fine_amount,
        "return_date": transaction.return_date,
    } 
    
@app.get("/members/{member_id}/transactions")
def get_member_transactions(member_id: int, db: Session = Depends(get_db)):
    member = db.query(Member).filter(Member.member_id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    results = (
        db.query(Transaction, Book)
        .join(Book, Transaction.book_id == Book.book_id)
        .filter(Transaction.member_id == member_id)
        .all()
    )

    transactions = []
    for transaction, book in results:
        transactions.append({
            "transaction_id": transaction.transaction_id,
            "book_id": book.book_id,
            "book_title": book.title,
            "cover_image_url": book.cover_image_url,
            "issue_date": transaction.issue_date,
            "due_date": transaction.due_date,
            "return_date": transaction.return_date,
            "fine_amount": transaction.fine_amount,
            "status": transaction.status,
        })

    return transactions    

@app.get("/librarian/test")
def librarian_test(current_user: Member = Depends(require_librarian)):
    return {"message": f"Welcome, librarian {current_user.name}!"}
    

@app.post("/books")
def add_book(
    book: BookCreate,
    db: Session = Depends(get_db),
    current_user: Member = Depends(require_librarian)
):
    new_book = Book(
        title=book.title,
        author=book.author,
        isbn=book.isbn,
        genre=book.genre,
        published_year=book.published_year,
        cover_image_url=book.cover_image_url,
        total_copies=book.total_copies,
        available_copies=book.total_copies,
    )
    db.add(new_book)
    db.commit()
    db.refresh(new_book)

    return {"message": "Book added successfully", "book_id": new_book.book_id}

@app.put("/books/{book_id}")
def update_book(
    book_id: int,
    book_update: BookUpdate,
    db: Session = Depends(get_db),
    current_user: Member = Depends(require_librarian)
):
    book = db.query(Book).filter(Book.book_id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    update_data = book_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(book, field, value)

    db.commit()
    db.refresh(book)

    return {"message": "Book updated successfully", "book": book}


@app.delete("/books/{book_id}")
def delete_book(
    book_id: int,
    db: Session = Depends(get_db),
    current_user: Member = Depends(require_librarian)
):
    book = db.query(Book).filter(Book.book_id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    db.delete(book)
    db.commit()

    return {"message": "Book deleted successfully"}        

@app.get("/members")
def get_members(db: Session = Depends(get_db), current_user: Member = Depends(require_librarian)):
    members = db.query(Member).all()
    return members

@app.put("/members/{member_id}/status")
def update_member_status(
    member_id: int,
    status_update: MemberStatusUpdate,
    db: Session = Depends(get_db),
    current_user: Member = Depends(require_librarian)
):
    member = db.query(Member).filter(Member.member_id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    member.is_active = status_update.is_active
    db.commit()
    db.refresh(member)

    status_text = "activated" if status_update.is_active else "blocked"
    return {"message": f"Member {status_text} successfully", "member_id": member.member_id}

@app.post("/recommend")
def get_recommendation(request: RecommendRequest, db: Session = Depends(get_db)):
    results = recommend_books(request.query, db, request.member_id)
    return {"recommendations": results}