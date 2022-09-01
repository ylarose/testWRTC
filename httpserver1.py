# Simple HTTP Server to test stuff
# Simple HTTP Server to test stuff
# needs python2 and Flask library

from flask import Flask, render_template, request, send_from_directory, jsonify, abort
from flask_sock import Sock

import logging
from logging.handlers import RotatingFileHandler

import sys

COMRATIO_STAT = 'COM'


app = Flask(__name__)
sock = Sock(app)

app.Debug = True

# logging through simple print
LOGGING = 'simple'

def log(str):

    if LOGGING == 'simple':
        print(str)
    else:
        app.logger.info("Calling callWS with {0} - {1} - {2}". format(server, day1, day2))
    return

@app.route('/')
def index():
    log('Got /')
    return 'Hello world!'


@app.route('/<path:path>')
def getFile2(path):
    # only accept extension in: .html, .js, .jpg
    log('Getting file: ' + path)

    str = ""
    if (path.endswith(".html") or path.endswith(".js") or path.endswith(".jpg") or path.endswith(".svg") or path.endswith(".mp3")): 
        str = send_from_directory('', path)
    else:
        log('File type not supported: ' + path)
        # awslogger.addlog('Getting file: ' + path)
        str = "<h2>File not supported</h2>"
    return str



socket_list = []

# broadcast to the other socker (not myself)
def broadcast(data, mysock):
    for sock in socket_list:
        if mysock is not None and mysock == sock:
            log("Not sending msg to myself")
        else:
            try:
                log("writing " + data + " to socket:" + str(sock))
                sock.send(data)
            except:
                log("Something else went wrong with socket")
                log("Removing socket: " + str(sock))                
                socket_list.remove(sock)


@sock.route('/signaling')
def echo(sock):
    
    log("got new socket:" + str(sock))

    # test if it should replace another one
    for s in socket_list:
        try:
            log("writing test to socket:" + str(s))
            s.send("test")
        except Exception as e:
            log("Oops!" + str(e.__class__) + "occurred while writing to socket.")
            log("Removing socket: " + str(s))            
            socket_list.remove(s)

    
    # add socket to list of all regisitered socket, for broadcasting
    socket_list.append(sock)
    
    while True:
        data = sock.receive()
        log('socket received : ' + str(data))
        # sock.send(data)
        broadcast(data, sock)
     
     
        
if __name__ == '__main__':
    logHandler = RotatingFileHandler('info.log', maxBytes=10000, backupCount=5)
    logHandler.setLevel(logging.INFO)
    logHandler.setFormatter(logging.Formatter('[%(asctime)s] %(levelname)s in %(module)s: %(message)s'))
    
    # print('Argument List:', str(sys.argv))
    if (len(sys.argv) > 1):
        globalPath = sys.argv[1]

    # app.logger.setLevel(logging.INFO)
    # app.logger.addHandler(logHandler)
    log("Starting httpserver.py")
    app.run(debug=True, host='0.0.0.0', port=8080)


