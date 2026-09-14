from sqlalchemy import Column, Integer, String, Numeric, TIMESTAMP, Boolean, ForeignKey
from database import Base
from datetime import datetime

class Book(Base):
    __tablename__ = "books"

    book_id = Column(Integer, primary_key=True)
    title = Column(String)
    author = Column(String)
    isbn = Column(String)
    genre = Column(String)
    published_year = Column(Integer)
    cover_image_url = Column(String)
    average_rating = Column(Numeric)
    total_copies = Column(Integer)
    available_copies = Column(Integer)
    added_at = Column(TIMESTAMP)

class Member(Base):
    __tablename__ = "members"

    member_id = Column(Integer, primary_key=True)
    name = Column(String)
    email = Column(String)
    password_hash = Column(String)
    phone = Column(String)
    role = Column(String)
    is_active = Column(Boolean, default=True)
    last_login = Column(TIMESTAMP)
    joined_at = Column(TIMESTAMP, default=datetime.now)
    updated_at = Column(TIMESTAMP, default=datetime.now) 
    
class Transaction(Base):
    __tablename__ = "transactions"

    transaction_id = Column(Integer, primary_key=True)
    book_id = Column(Integer, ForeignKey("books.book_id"))
    member_id = Column(Integer, ForeignKey("members.member_id"))
    issue_date = Column(TIMESTAMP, default=datetime.now)
    due_date = Column(TIMESTAMP)
    return_date = Column(TIMESTAMP)
    fine_amount = Column(Numeric)
    status = Column(String)
    created_at = Column(TIMESTAMP, default=datetime.now)
    