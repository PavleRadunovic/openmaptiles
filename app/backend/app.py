#from crypt import methods
from flask import (
    Flask,
    request,
    jsonify,
    send_file,
)
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.ext.automap import automap_base
from sqlalchemy import create_engine, MetaData, text
from flask_marshmallow import Marshmallow
from sqlalchemy.orm import Session
from flask_cors import CORS
from sqlalchemy.orm import load_only
from flask_bootstrap import Bootstrap
from pathlib import Path

app = Flask(__name__)  # initialize Flask application 

# modification tracking is disabled, it takes up additional memory
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)  # connecting SQLAlchemy to the application
CORS(app)  # adding CORS to the application (so that browsers do not restrict)
ma = Marshmallow(app)  # connecting marshmallow to the app
db.init_app(app)
bootstrap = Bootstrap(app)
# scheme name (here the scheme changes when updating)
sema = "public"
# adding scema as data for connection via auto map
m = MetaData(schema=sema)
# defining an automap engine
Base = automap_base(metadata=m)
# link to automap database
engine = create_engine(
    "postgresql://openmaptiles:openmaptiles@postgres/openmaptiles", pool_pre_ping=True, pool_recycle=300
)
# connecting via automap to base
Base.prepare(engine, reflect=True)
# creating a session with an automap database
session = Session(engine)


# endpoints that return a particular visual style
@app.route("/placesStyle", methods=["GET"])
def placesStyle():
    file_to_send = Path('styles/places.json')
    return send_file(str(file_to_send))


@app.route("/basicStyle", methods=["GET"])
def basicStyle():
    file_to_send = Path('styles/basic.json')
    return send_file(str(file_to_send))


# endpoint that serves for full text search
# the desired search entry is unpacked into a single record and a string of input words is formed which must be in a certain format to be searched in the database
@app.route("/street", methods=["GET"])
def street():
    search_text = request.args.get("search_text")
    if search_text is None or search_text == '':
        return jsonify({"message": "Empty field!"})
    search_text_split = search_text.split()
    search = ''
    for i in range(len(search_text_split)):
        try:
            parametar = int(search_text_split[i])
        except:
            parametar = search_text_split[i]

        if i == len(search_text_split)-1:
            if type(parametar) is int:
                search = search + search_text_split[i]
            else:
                search = search + search_text_split[i] + ':*'
        else:
            if type(parametar) is int:
                search = search + search_text_split[i] + ' & '
            else:
                search = search + search_text_split[i] + ':*' + ' & '
    Fields = [
        "geom_json",
        "geom_latlng_json",
        "x_min",
        "x_max",
        "y_min",
        "y_max",
        "lat_min",
        "lng_min",
        "lat_max",
        "lng_max",
        "osm_id",
        "street_name",
        "street_name_en",
        "highway",
        "ts_data",
        "name",
        "name_alt",
        "name_local",
        "type",
        "type_en"
    ]

    class Street(ma.Schema):
        class Meta:
            fields = tuple(Fields)
    street = (
        Base.classes.street
    )  # defining the table in the database we need
    street_schema = Street(
        many=True
    )  # creating an object previously created class for the serializer scheme
    street_all = (
        session.query(street)
        .options(load_only(*Fields))
        .filter(text("""ts_data @@ to_tsquery('simple', :search)"""))
        .params(search=search)
        .order_by(street.street_name)
        .limit(20)
        .all()
    )
    street_dump = street_schema.dump(
        street_all
    )  # dumping query results using serializer schema
    js = jsonify(street_dump[0])  # converts data to json format
    return js  # final sending of data to the client


if __name__ == '__main__':
    app.run(host='0.0.0.0', port='5000', debug=True)
