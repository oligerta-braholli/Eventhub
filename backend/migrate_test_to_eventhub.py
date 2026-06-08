from pymongo import MongoClient

uri = 'mongodb+srv://oligertabb_db_user:8I5JboI0mp4VyrLl@cluster0.6laby5f.mongodb.net/?appName=Cluster0'
client = MongoClient(uri)

source = client['test']
target = client['eventhub']

collections = source.list_collection_names()
print(f'Collections to migrate: {collections}\n')

for col_name in collections:
    source_col = source[col_name]
    target_col = target[col_name]

    docs = list(source_col.find({}))
    if not docs:
        print(f'  {col_name}: empty, skipping')
        continue

    target_col.drop()
    result = target_col.insert_many(docs)
    print(f'  {col_name}: {len(result.inserted_ids)} documents migrated')

print('\nMigration complete.')
client.close()
