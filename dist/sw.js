
const dbName = 'digitalchecker';
const objStore = 'quiz'
const dbVersion = 1;

const metaData = [
    { id: "123", value: 'test' }
]

const connect = () => {
    return new Promise((resolve, reject) => {

        const db = indexedDB.open(dbName, dbVersion);

        db.onerror = event => {
            console.log('error opening IndexedDB');
            reject();
        };

        db.onsuccess = event => {
            console.log('success opening IndexedDB')

            resolve(event.target.result);
        }

        db.onupgradeneeded = event => {
            console.log('onupgradeneeded');

            const db = event.target.result;

            switch (dbVersion) {

                case 1:
                    const store = db.createObjectStore(objStore, { keyPath: 'id', autoIncrement: true });
                    store.createIndex("active", "active", { unique: false });
                    store.transaction.oncomplete = async (event) => {
                        const response = await fetch('data.json')
                        const data = await response.json()

                        const store = db
                            .transaction(objStore, "readwrite")
                            .objectStore(objStore);

                        data.forEach(element => {
                            element.active = false;
                            store.add(element)
                        });
                    }
            }
        };
    })
}

addEventListener("install2", (event) => {
    console.log("install");

    event.waitUntil(
        new Promise((resolve, reject) => {

            const db = indexedDB.open(dbName, dbVersion);

            db.onerror = event => {
                console.log('error opening IndexedDB');
                reject();
            };

            db.onsuccess = event => {
                console.log('onsuccess')

                resolve(db.result);
            }

            db.onupgradeneeded = event => {
                console.log('onupgradeneeded');

                const db = event.target.result;
                const objectStore = db.createObjectStore("meta");
                objectStore.transaction.oncomplete = (event) => {
                    const metaObjectStore = db
                        .transaction("meta", "readwrite")
                        .objectStore("meta");
                    metaObjectStore.add("test1", "testversion"); // Wert, Schlüssel
                    metaObjectStore.add(1, "currentQuestion");
                }

                /*                 const objectStore = db.createObjectStore("meta", { keyPath: "id" });
                                objectStore.transaction.oncomplete = (event) => {
                                    const metaObjectStore = db
                                        .transaction("meta", "readwrite")
                                        .objectStore("meta");
                
                                    metaData.forEach((item)=>{
                                        metaObjectStore.add(item, );
                                    })
                                } */
            }
        }).then(db => {

            console.log('OKOK')
            return skipWaiting();
        }
        ));
});

oninstall = async (event) => {
    event.waitUntil(
        new Promise(async (resolve, reject) => {

            await connect();

            skipWaiting();

            resolve();
        }));
}

onfetch = (event) => {
    console.log("onfetch")

    event.respondWith(new Promise(async (resolve, reject) => {
        const db = await connect();

        const
            transaction = db.transaction(objStore, 'readwrite'),
            store = transaction.objectStore(objStore),
            cursorRequest = store.openCursor(4);

        let out = 0

        cursorRequest.onsuccess = event => {
            const cursor = event.target.result;
            if (cursor) {
                out++
                cursor.continue();
            } else {
                let json = '{"status": "' + out + '"}'
                resolve(
                    new Response(
                        json,
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                'Content-Length': json.length
                            }
                        }))
            }

        }
    }));
}

addEventListener("fetch2", (event) => {
    console.log("fetch2");

    const url = new URL(event.request.url);
    const method = event.request.method;

    console.log(method)

    if (!url.pathname.startsWith('/db')) {
        console.error("fetch not /db");
        return;
    }

    const [_, db, objStore, id] = url.pathname.split('/', 4);

    /*     console.debug(event.request)
        console.debug(url.pathname.split('/', 4))
        console.debug(objStore, id) */

    event.respondWith(new Promise((resolve, reject) => {

        const result = {}
        const request = indexedDB.open(dbName, dbVersion);

        request.onsuccess = event => {
            const db = request.result;

            db.onerror = event => {
                console.error('db error', event)
            }

            const transaction = db.transaction([objStore, 'meta'], 'readwrite');

            transaction.objectStore('meta').openCursor().onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    result[cursor.key] = cursor.value;
                    cursor.continue();
                }

                transaction.objectStore(objStore).get(id).onsuccess = event => {
                    result.data = event.target.result;
                    result.dbVersion = db.version;

                    let json = JSON.stringify(result);

                    resolve(
                        new Response(
                            json,
                            {
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Content-Length': json.length
                                }
                            }
                        )
                    );
                }
            }
        }

        request.onerror = event => {
            console.log('error opening IndexedDB');
            reject();
        }
    }));
});

addEventListener("activate", (event) => {
    console.log("activate");
    event.waitUntil(clients.claim());
});