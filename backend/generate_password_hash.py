import getpass

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

if __name__ == "__main__":
    password = getpass.getpass("Choose your owner password: ")
    print("\nPaste this into your .env as OWNER_PASSWORD_HASH:\n")
    print(pwd_context.hash(password))
