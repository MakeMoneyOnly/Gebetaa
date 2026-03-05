with open('c:/Users/user/Desktop/Gebetaa/.github/workflows/ci.yml', 'rb') as f:
    f.seek(-100, 2)
    content = f.read()
    print(content.hex())
