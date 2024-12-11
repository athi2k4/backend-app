//controller function hat fetches the data from the database as per the user's request

const fetchmillion = async (req, res) => {
       try {
            // decode's the endcode data sent
            const pageno =decodeURIComponent(req.query.pageno);
            const Organization = decodeURIComponent(req.query.Organization);
            const Rating = decodeURIComponent(req.query.Rating);
            const limit = 10;
            const filter = {};
            //used to sanitze the string (i.e.) organization
            function ExtraCharacters(input) {
               
                return input.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
            }
            //organization is sanitized using regex and it is taken case insensitive
            // with the character matching anywhere in string for a better dynamic search
            if(Organization) {
                const org= ExtraCharacters(Organization)
                console.log(org);
                filter.Organization = { $regex: `${org}`, $options: "i" }; 
            }
            if (Rating) filter.Rating = parseFloat(Rating);
           //accessing the collection from the local database
            const db = req.app.locals.db;     
            const collection = db.collection("millions");
            const targetPage = parseInt(pageno, 10);
            let data;
            //when the entered page number is valid i.e >0 we find the  number of documents that should be skipped and 
            //find the_id of the last document that has to be skipped so that we can access documents
            // after that document thus jumping using crsor based pagination.
        if (pageno) {
                const documentsToSkip = (targetPage - 1) * limit;
                const cursor = await collection.find(filter).project({ _id: 1 }).limit(documentsToSkip + 1).toArray();
                const startingId = cursor.length > documentsToSkip ? cursor[documentsToSkip]._id : null;
                if (startingId) {
                    data = await collection
                        .find({ ...filter, _id: { $gte: startingId } })
                        .limit(limit)
                        .toArray();
                } else {
                      data = [];
                }
            } else {
                data = await collection.find(filter).limit(limit).toArray();
            }

            const totald = await collection.countDocuments(filter); 
            const totalp = Math.ceil(totald / limit); 
            console.log(totald, totalp);
            // we calculate the necessary data that should be sent like the total pages,
            // nextfinal id so that you can use it for cursor basd pagination
            res.json({
                data,
                totalp,
                currentp: targetPage,
                nextfinalID: data.length > 0 ? data[data.length - 1]._id : null,
    
                filter: { Organization, Rating },
            });
        } catch (err) {
            console.error("Error fetching data:", err);
            res.status(500).send("An error occurred while fetching data.");
        }
    }

module.exports = { fetchmillion };
