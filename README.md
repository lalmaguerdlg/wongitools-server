# WongiTools Server

A small http server made to listen to display the heart beat data from an apple watch.

## Server broadcaster

The server-broadcaster is a small service discovery implementation so that the apple watch is able to find a listening service to send the hear beat data.

Any application can register itself to the server-broadcaster and any client can ask with UDP broadcasting if a particular service is accepting connections.

The server-broadcaster will respond with the IP address and port of the asked service.
