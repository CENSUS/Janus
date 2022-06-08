from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
import typer


def gen_key():
    private_key = rsa.generate_private_key(
        public_exponent=65537, key_size=4096, backend=default_backend()
    )

    return private_key


def save_key(pk, filename: str):

    password = typer.prompt(
        "Enter passphrase (empty for no passphrase)",
        confirmation_prompt=True,
        hide_input=True,
        default=""
    )
    # convert str password to bytes
    if password and isinstance(password, str):
        password = password.encode()
        encryption_alg = serialization.BestAvailableEncryption(
            password)
    else:
        password = None
        encryption_alg = serialization.NoEncryption()

    private_key = pk.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=encryption_alg)
    with open(filename, 'wb') as pk_out:
        pk_out.write(private_key)

    public_key = pk.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )

    with open(f"{filename}.pub", 'wb') as public_out:
        public_out.write(public_key)


def create_key_pair(filename: str, password: str = None):
    private_key = gen_key()
    save_key(private_key, filename)


if __name__ == '__main__':
    typer.run(create_key_pair)
