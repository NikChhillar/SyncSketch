
const { Server } = require('socket.io');
const io = new Server({
    cors: "https://sync-sketch.vercel.app/"
})
io.on('connection', function (socket) {

    socket.on('canvasImage', (data) => {
        socket.broadcast.emit('canvasImage', data);
    });
});

io.listen(5000);