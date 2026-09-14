from pydantic import BaseModel, EmailStr
from typing import Optional


class MemberCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    role: str = "student"
    
    
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    
class IssueRequest(BaseModel):
    member_id: int
    book_id: int
    
class ReturnRequest(BaseModel):
    member_id: int
    book_id: int    
            
class BookCreate(BaseModel):
    title: str
    author: Optional[str] = None
    isbn: Optional[str] = None
    genre: Optional[str] = None
    published_year: Optional[int] = None
    cover_image_url: Optional[str] = None
    total_copies: int = 1
    
class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    isbn: Optional[str] = None
    genre: Optional[str] = None
    published_year: Optional[int] = None
    cover_image_url: Optional[str] = None
    total_copies: Optional[int] = None
    
class MemberStatusUpdate(BaseModel):
    is_active: bool                    
    
class RecommendRequest(BaseModel):
    query: str = ""
    member_id: int = None   
    