from sqlalchemy import Column, Integer, String, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

Base = declarative_base()


class Operation(Base):
    __tablename__ = "operaciones"
    id = Column(Integer, primary_key=True)
    kind = Column(String)
    status = Column(String)
    date = Column(String)
    cents = Column(Integer)


OPERATIONS = [
    dict(id=i, kind="retiro" if i % 3 == 0 else "transferencia",
         status="pendiente" if i % 4 == 0 else "confirmada",
         date=f"2026-10-{(i * 7) % 13 + 1:02d}", cents=2500 + i * 100)
    for i in range(1, 31)
]


def open_operations_database():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    db.add_all([Operation(**row) for row in OPERATIONS])
    db.commit()
    return db, engine
