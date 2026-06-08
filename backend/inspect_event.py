from pymongo import MongoClient

uri = 'mongodb+srv://oligertabb_db_user:8I5JboI0mp4VyrLl@cluster0.6laby5f.mongodb.net/?appName=Cluster0'
client = MongoClient(uri)
db = client.get_default_database()
print('DB:', db.name)

filter_query = {'title': {'$regex': 'UX & Design Malmö 2026', '$options': 'i'}}
events = list(db.events.find(filter_query))
print('Found events:', len(events))
for e in events:
    print('---')
    print('id', str(e['_id']))
    print('title', e.get('title'))
    print('status', e.get('status'))
    print('capacity', e.get('capacity'))
    print('bookedCount', e.get('bookedCount'))
    print('ticketTypes', [(t['name'], t.get('quantity'), t.get('sold')) for t in e.get('ticketTypes', [])])
    confirmed_bookings = db.bookings.count_documents({'event': e['_id'], 'status': 'confirmed'})
    cancelled_bookings = db.bookings.count_documents({'event': e['_id'], 'status': 'cancelled'})
    tickets = db.tickets.count_documents({'event': e['_id']})
    waitlist = db.waitlists.count_documents({'event': e['_id']})
    print('confirmed bookings', confirmed_bookings)
    print('cancelled bookings', cancelled_bookings)
    print('tickets total', tickets)
    print('waitlist entries', waitlist)
    for t in e.get('ticketTypes', []):
        print('  ticket', t['name'], 'qty', t.get('quantity'), 'sold', t.get('sold'))
