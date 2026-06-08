from pymongo import MongoClient
uri = 'mongodb+srv://oligertabb_db_user:8I5JboI0mp4VyrLl@cluster0.6laby5f.mongodb.net/?appName=Cluster0'
client = MongoClient(uri)
print(client.list_database_names())
