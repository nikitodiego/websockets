let modulo = require("./manejoArchivos")
const prod = new modulo.nombreExportacion("./productos.json");

const express = require('express');
const app = express();
const { Router } = require('express');
const router = Router();
const handlebars = require('express-handlebars'); //Ojo que lo requiero pero no hay que instanciarlo...

//Middlewares
app.use('/api/productos', router);
app.use(express.json());
app.use(express.urlencoded({extended: false }));
app.use(express.static('public'));

//Websocket
const { Server: HttpServer } = require('http')
const { Server: IOServer } = require('socket.io')

const httpServer = new HttpServer(app)
const io = new IOServer(httpServer)

//Cargo el archivo de productos en memoria para que el engine lo renderice 

const fs = require('fs');
const jsonData = fs.readFileSync("productos.json");
const data = JSON.parse(jsonData);

const messages = [
    { author: "juan@gmail.com", date: "2022-01-29T18:59:43.106Z", text: "¡Hola! ¿Que tal?" },
    { author: "pedro@gmail.com", date: "2022-01-29T18:59:43.106Z", text: "¡Muy bien! ¿Y vos?" },
    { author: "ana@gmail.com", date: "2022-01-29T18:59:43.106Z", text: "¡Genial!" }
 ]; 
 
 io.on('connection',socket => {
    console.log('Un cliente se ha conectado');
    socket.on('new-message',data => {
        messages.push(data);
        io.sockets.emit('messages', messages);
        //fs.writeFileSync("chat.json",(JSON.stringify(messages))); Si lo guardo en el archivo, lo muestra en pantalla pero después lo saca.
    });
    socket.emit('messages', messages);
    //Enviar lista de productos
    socket.emit('productos', data);
 });


//Configuracion de handlebars
app.set("views", "./views");
app.set("view engine","hbs");
app.engine("hbs", handlebars.engine({
    extname: "hbs",
    defaultLayout: 'index',
    //layoutsDir: __dirname + "/views/layouts",
    //partialsDir: __dirname + '/views/partials'
}));


//End point principal para renderización de la plantilla
app.get('/',(req,res) => {
    res.render("main",{datos: data, listExists: true});
});

//End points de la api
router.get('/', async (req,res) => {
    const a = await prod.getAll();
    res.send(a);
});

router.get('/:id', async (req,res) => {
    const {id} = req.params;
    const a = await prod.getById(id);
    if (a == null){
        res.json({ error : 'producto no encontrado'});
    } else {
        res.json(a);
    }
});

app.post('/form.html', async (req, res) => {
    const a = await req.body;
    await prod.save(req.body);
    res.redirect("/form.html");
  });


router.delete('/:id', async (req,res) =>{
    const {id} = req.params;
    const a = await prod.getById(id);
    if (a == null){
        res.json({ error : 'producto no encontrado'});
    } else {
        const b = await prod.deleteById(id);
        const c = await prod.getAll();
        res.json(c);
    }

});

app.put('/api/productos/:id', (req,res) =>{
    let id = req.params.id;
    console.log(id);
    let a = req.body;
    let b = a.title;
    let c = a.price;
    let d = a.thumbnail;
    //console.log(a,b,c,d);
    
    //console.log (data);
    for (element of data){
        if (element.id == id){
            element.title = b;
            element.price = c;
            element.thumbnail = d;
        }
    }
    fs.writeFileSync("productos.json", (JSON.stringify(data)));
    res.json(data);
});

httpServer.listen(3000, function() {
    console.log('Servidor corriendo en http://localhost:3000');
})
