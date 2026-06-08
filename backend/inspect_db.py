from pymongo import MongoClient

uri = 'mongodb+srv://oligertabb_db_user:8I5JboI0mp4VyrLl@cluster0.6laby5f.mongodb.net/?appName=Cluster0'
client = MongoClient(uri)

db = client.test
print('DB:', db.name)
print('collections:', db.list_collection_names())
for name in db.list_collection_names():
    print('---', name)
    for doc in db[name].find().limit(5):
        print(doc)
