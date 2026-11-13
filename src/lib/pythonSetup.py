from sqlalchemy import Boolean, Column, Integer, String, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

Base = declarative_base()


class Pet(Base):
    __tablename__ = "pets"
    id = Column(Integer, primary_key=True)
    species = Column(String(40))
    city = Column(String(60))
    urgency_level = Column(Integer)
    is_adopted = Column(Boolean, default=False)


PETS = [
    {
        "id": i,
        "species": "dog" if i % 3 else "cat",
        "city": "Guayaquil" if i % 4 else "Quito",
        "urgency_level": (i % 5) + 1,
        "is_adopted": i % 7 == 0,
    }
    for i in range(1, 51)
]


def open_pets_database():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    db.add_all([Pet(**row) for row in PETS])
    db.commit()
    return db, engine
