from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, Float, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime, timedelta
import random
from faker import Faker
import os
from dotenv import load_dotenv

load_dotenv()

def get_database_url():
    return os.getenv("DATABASE_URL", "postgresql://user:password@db:5432/ksp_db")

from app.models.user import Base, User

class Location(Base):
    __tablename__ = "locations"
    id = Column(Integer, primary_key=True, index=True)
    district = Column(String, index=True)
    station = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)

class FIR(Base):
    __tablename__ = "firs"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, default=datetime.utcnow)
    crime_type = Column(String, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"))
    status = Column(String) # Open, Closed, Under Investigation
    description = Column(Text)

    location = relationship("Location")
    accused = relationship("Accused", back_populates="fir")
    victims = relationship("Victim", back_populates="fir")

class Accused(Base):
    __tablename__ = "accused"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    age = Column(Integer)
    gender = Column(String)
    prior_offenses = Column(Integer)
    mo_tags = Column(String) # Comma separated Modus Operandi tags
    habitual_flag = Column(Boolean, default=False)
    fir_id = Column(Integer, ForeignKey("firs.id"))

    fir = relationship("FIR", back_populates="accused")

class Victim(Base):
    __tablename__ = "victims"
    id = Column(Integer, primary_key=True, index=True)
    age = Column(Integer)
    gender = Column(String)
    socio_economic_bg = Column(String)
    fir_id = Column(Integer, ForeignKey("firs.id"))

    fir = relationship("FIR", back_populates="victims")

class FinancialTransaction(Base):
    __tablename__ = "financial_transactions"
    id = Column(Integer, primary_key=True, index=True)
    accused_id = Column(Integer, ForeignKey("accused.id"))
    amount = Column(Float)
    date = Column(DateTime, default=datetime.utcnow)
    flagged_status = Column(Boolean, default=False)
    account_number = Column(String)

class DistrictIndicator(Base):
    __tablename__ = "district_indicators"
    id = Column(Integer, primary_key=True, index=True)
    district = Column(String, unique=True)
    urbanization_pct = Column(Float)
    migration_rate = Column(Float)
    literacy_rate = Column(Float)
    unemployment_index = Column(Float)
    pop_density = Column(Float)

class CrimeStat(Base):
    __tablename__ = "crime_stats"
    id = Column(Integer, primary_key=True, index=True)
    district = Column(String)
    crime_type = Column(String)
    month = Column(Integer)
    year = Column(Integer)
    count = Column(Integer)
    event_date = Column(Boolean, default=False)
    event_name = Column(String, nullable=True)

class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"))
    role = Column(String) # user or assistant
    content = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
