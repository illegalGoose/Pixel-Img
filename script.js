window.addEventListener("load", function(){
    const canvas = document.getElementById("canvas1");
    const ctx = canvas.getContext('2d'); // Только для переменной, которая содержит ссылку на элемент <canvas>. Можно передать в 2d или webgl
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    class Particle { // Для создания отдельный частиц объекта
        constructor(effect, x, y, color){
            this.effect = effect;
            this.x = Math.random() * this.effect.width; //this говорит, что свойство выполняется прямо сейчас
            this.y = 0;
            this.originX = Math.floor(x); // Это свойство будет помнить, где находится эта частица в общем изображении
            this.originY = Math.floor(y);
            this.color = color; // Это будет хранить цвет частицы
            this.size = this.effect.gap; // Размер каждой прямоугольной частицы 3px
            this.vx = 0; // Устанавливает горизонтальную скороть движения частиц
            this.vy = 0;
            this.ease = 0.03;
            this.friction = 0.95;
            this.dx = 0;
            this.dy = 0;
            this.distance = 0;
            this.force = 0;
            this.angle = 0;
        }
        draw(context){ // Определяет, как будет выглядеть каждая частица
            context.fillStyle = this.color; //Стиль заливки каждой частицы
            context.fillRect(this.x, this.y, this.size, this.size);
        }
        update(){ //Заставляет частицы двигаться
            this.dx = this.effect.mouse.x - this.x;
            this.dy = this.effect.mouse.y - this.y;
            this.distance = this.dx * this.dx + this.dy * this.dy;
            this.force = -this.effect.mouse.radius / this.distance;

            if (this.distance < this.effect.mouse.radius){
                this.angle = Math.atan2(this.dy, this.dx);
                this.vx += this.force * Math.cos(this.angle);
                this.vy += this.force * Math.sin(this.angle);
            }

            this.x += (this.vx *= this.friction) + (this.originX - this.x) * this.ease;
            this.y += (this.vy *= this.friction) + (this.originY - this.y) * this.ease;
        }

        warp(){
            this.x = Math.random() * this.effect.width;
            this.y = Math.random() * this.effect.height;
            this.ease = 0.05
        }
    }

    class Effect { // Для одновременной обработки всех частиц
        constructor(width, height){
            this.width = width;
            this.height = height;
            this.particlesArray = []; // Массив частиц. Будет содержать все активные, в данный момент, частицыЮ созданные классом Particle
            this.image = document.getElementById("image1");
            this.centerX = this.width * 0.5; // Центирование изображения по горизонтали
            this.centerY = this.height * 0.5;
            this.x = this.centerX - this.image.width * 0.5; // Центирование изображения по горизонтал
            this.y = this.centerY - this.image.height * 0.5;
            this.gap = 5; //Измеряется в ps. Чем больше, тем выше производительность, но более пиксельное изображение
            this.mouse = {
                radius: 7000,
                x: undefined,
                y: undefined
            }
            window.addEventListener('mousemove', event => {
                this.mouse.x = event.x;
                this.mouse.y = event.y;
            });
        }
        // init(){ //Инициализирует эффект и заполняет массив частиц множеством объектов частиц. 
        //     /*for(let i = 0; i < 100; i++){
        //         this.particlesArray.push(new Particle(this));
        //     }*/
        // }
        init(context){ // Рисует изображение, анализирует и превращает в частицы
            context.drawImage(this.image, this.x, this.y); //Рисуем изображение на холсте
            const pixels = context.getImageData(0, 0, this.width, this.height).data; //Массив, содержащий все позиции и значения цвета для каждого пикселя на холсте. getImageData анализирует определенную часть холста и возвращает данные о его пикселях в форме специального объекта данных изображения. Должен принимать 4 аргумента для указания того, какую часть холста нужн анализировать. data(как раз указывает на массив данных с местоположением и цветами пикселей)
            for(let y = 0; y < this.height; y += this.gap){ //Цикл обрабатывает вертикальную координату y
                for(let x = 0; x < this.width; x += this.gap){ //Цикл обрабатывает горизонтальную ось x. То есть каждый раз мы сначала проверяем ось y, входим в цикл с осью x, которая в свою очередь прыгает на 5 пикселей(this.gap) и как только она заканчивается, переходим на следующую ось y через 5 пикселей
                    const index = (y * this.width + x) * 4; // На 4 потому что каждый пиксель представлен четырьмя позициями в массиве pixels(red, green, blue, alpha).
                    const red = pixels[index]; // Индекс красного 1
                    const green = pixels[index + 1]; // Индекс зеленого 2
                    const blue = pixels[index + 2]; // Индекс синего 3
                    const alpha = pixels[index + 3]; // Индекс альфы 4
                    const color = 'rgb('+ red + ',' + green + ',' + blue + ')';

                    if (alpha > 0){ // Если альфа больше 0, это означает, что пиксель в этой области непрозрачный, поэтомк используем класс Particle для создания частицы с данным пикселем
                        this.particlesArray.push(new Particle(this, x, y, color));
                    }
                } 
            }
        }
        draw(context){ // Рисует все частицы
            this.particlesArray.forEach(particle => particle.draw(context)); // Для каждого элемента масива частица вызывает draw метод со строки 15
        }
        update(){ //Вызывает обновление всех активных, в данный момент, объектов.
            this.particlesArray.forEach(particle => particle.update());
        }
        warp(){
            this.particlesArray.forEach(particle => particle.warp());
        }
    }

    const effect = new Effect(canvas.width, canvas.height); //Передаем canvas в класс effect, преобразую его в точку со свойством на строке 23 и используя значение на строке 12 для расчета положения частицы.
    effect.init(ctx);

    function animate(){ // Чтобы сделать все анимированным и интерактивным 
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        effect.draw(ctx);
        effect.update();
        requestAnimationFrame(animate); // Перед следующей перерисовкой браузера вызывает передаваемую функцию, создаваю анимацию
    }
    animate();

    //warp button
    const warpButton = document.getElementById('warpButton');
    warpButton.addEventListener('click', function(){
        effect.warp();
    });

    // ctx.fillRect(100, 200, 100, 200); // Рисуем прямоугольник с помощью переменной и встроенного метода fillReact, который ожидает 4 аргумента (ось x(где рисовать(отсчет пикселей слева)), ось y(где рисовать(отсчет пикселей сверху)), ширина 100(ширина прямоугольника), высота 200(высота прямоугольнкиа))
    // ctx.drawImage(image1, 700, 200, 400, 400) // Ожидает как минимум 3 аргумента (изображение, координата x, координата y). Последующие агументы, которые можно передать - ширина и высота изображения

});