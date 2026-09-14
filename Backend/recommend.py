import os
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from sqlalchemy.orm import Session
from models import Book, Transaction

llm = ChatGoogleGenerativeAI(
    model="gemini-3.5-flash-lite",
    google_api_key=os.getenv("GOOGLE_API_KEY"),
)


def recommend_books(user_query: str, db: Session, member_id: int = None) -> list:
    all_books = db.query(Book).limit(50).all()
    book_list_text = "\n".join(
        [f"- {b.title} by {b.author} (Genre: {b.genre}, Rating: {b.average_rating})" for b in all_books]
    )

    history_text = ""
    if member_id:
        history = (
            db.query(Transaction, Book)
            .join(Book, Transaction.book_id == Book.book_id)
            .filter(Transaction.member_id == member_id)
            .all()
        )
        if history:
            history_list = "\n".join([f"- {book.title} (Genre: {book.genre})" for _, book in history])
            history_text = f"\n\nThis member has previously borrowed these books:\n{history_list}\n\nUse this reading history to inform your recommendations."

    query_text = user_query if user_query else "Suggest something based on my reading history."

    prompt = f"""You are a helpful library assistant. A member asked: "{query_text}"
{history_text}

Here is a sample of books available in the library:
{book_list_text}

Recommend exactly 3 books from the list above that best match what the member might enjoy.

Respond with ONLY a valid JSON array, no markdown formatting, no code fences, no extra text before or after. Use this exact format:
[{{"title": "exact title copied from the list above", "reason": "1-sentence reason"}}, {{"title": "...", "reason": "..."}}, {{"title": "...", "reason": "..."}}]
"""

    for attempt in range(2):
        response = llm.invoke(prompt)
        raw_text = response.content
        if isinstance(raw_text, list):
            raw_text = "".join([block.get("text", "") for block in raw_text if isinstance(block, dict)])

        raw_text = raw_text.strip()
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.lower().startswith("json"):
                raw_text = raw_text[4:]
        raw_text = raw_text.strip()

        try:
            ai_picks = json.loads(raw_text)
            if isinstance(ai_picks, list) and len(ai_picks) > 0:
                break
        except json.JSONDecodeError:
            ai_picks = []
    else:
        ai_picks = []

    results = []
    for pick in ai_picks:
        pick_title = pick.get("title", "").strip().lower()
        book = db.query(Book).filter(Book.title.ilike(f"%{pick_title[:30]}%")).first()
        if book:
            results.append({
                "book_id": book.book_id,
                "title": book.title,
                "author": book.author,
                "genre": book.genre,
                "cover_image_url": book.cover_image_url,
                "isbn": book.isbn,
                "average_rating": book.average_rating,
                "available_copies": book.available_copies,
                "total_copies": book.total_copies,
                "reason": pick.get("reason"),
            })

    if not results:
        fallback_books = db.query(Book).order_by(Book.average_rating.desc()).limit(3).all()
        for book in fallback_books:
            results.append({
                "book_id": book.book_id,
                "title": book.title,
                "author": book.author,
                "genre": book.genre,
                "cover_image_url": book.cover_image_url,
                "isbn": book.isbn,
                "average_rating": book.average_rating,
                "available_copies": book.available_copies,
                "total_copies": book.total_copies,
                "reason": "One of our highest-rated books.",
            })

    return results