 from app import create_app

# Use 'production' configuration for the live server
app = create_app("production")

if __name__ == "__main__":
    app.run()
