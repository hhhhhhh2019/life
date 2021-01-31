let [width, height] = [900, 900];

// 0 - обычный, 1 - кол-во энергии
let draw_type = 0;

let body = document.createElement("body");

let cnv = document.createElement("canvas");
[cnv.width, cnv.height] = [width, height];
body.appendChild(cnv);

let ctx = cnv.getContext("2d");

let cells_count = document.createElement("p");
body.appendChild(cells_count);

let cells_dead_count = document.createElement("p");
body.appendChild(cells_dead_count);

document.body = body;


function rect(x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
}

function line(x0, y0, x1, y1, c) {
    ctx.strokeStyle = c;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
}


let [map_width, map_height] = [90, 90];
let cell_width = Math.round(width / map_width);
let cell_height = Math.round(height / map_height);

let map = [];
for (let i = 0; i < map_height; i++) {
    let a = [];
    for (let j = 0; j < map_width; j++) {
        a.push(null);
    }
    map.push(a);
}

function num2dir(num) {
    if (num == 0) return [-1, 0];
    if (num == 1) return [-1, -1];
    if (num == 2) return [0, -1];
    if (num == 3) return [1, -1];
    if (num == 4) return [1, 0];
    if (num == 5) return [1, 1];
    if (num == 6) return [0, 1];
    if (num == 7) return [-1, 1];
}

/*  КОММАНДЫ ГЕНОВ

    фотосинтез          0..10
    поворот             11..20
    шаг                 21..30
    посмотреть          31..40
    сьесть              41..50
    безусловный переход 51..63
*/

class Wall {
    constructor(x, y) {
        [this.x, this.y] = [x, y];
    }

    draw() {
        rect(this.x * cell_width, this.y * cell_height, cell_width, cell_height, "brown");
    }
}

class Food {
    constructor(x, y) {
        [this.x, this.y] = [x, y];
    }

    draw() {
        rect(this.x * cell_width, this.y * cell_height, cell_width, cell_height, "orange");
    }
}

class Cell {
    constructor(x, y, e, d) {
        [this.x, this.y] = [x, y];
        this.energy = e;
        this.dnk = d;
        this.dnk_offset = 0;
        this.dir = Math.floor(Math.random() * 7);
        this.alive = true;
    }

    draw(id) {
        let [x, y] = [this.x, this.y]
        if (this.alive) {
            if (draw_type == 0)
                rect(x * cell_width, y * cell_height, cell_width, cell_height, "green");
            else {
                rect(x * cell_width, y * cell_height, cell_width, cell_height, "rgb("+
                    this.energy + ",0,0)");
            }
        }
        else
            rect(x * cell_width, y * cell_height, cell_width, cell_height, "gray");
        let d = num2dir(this.dir);
        line(x * cell_width + cell_width * 0.5, y * cell_height + cell_height * 0.5,
             x * cell_width + cell_width * 0.5 + d[0] * cell_width * 0.5, y * cell_height + cell_height * 0.5 + d[1] * cell_height * 0.5,
             "white")
    }

    step(id) {
        if (0 <= this.dnk[this.dnk_offset] && this.dnk[this.dnk_offset] <= 10) {
            this.energy += (map_height - this.y - 1) / map_height * 20;
        }

        else if (11 <= this.dnk[this.dnk_offset] && this.dnk[this.dnk_offset] <= 20) {
            this.dnk_offset = (this.dnk_offset + 1) % this.dnk.length;
            this.dir = (this.dir + this.dnk[this.dnk_offset]) % 7;
            this.energy -= 1;
        }

        else if (21 <= this.dnk[this.dnk_offset] && this.dnk[this.dnk_offset] <= 30) {
            let d = num2dir(this.dir);
            let [x, y] = [this.x + d[0], this.y + d[1]];
            if ((0 <= x && x < map_width) && (0 <= y && y < map_height)) {
                let next_cell = map[y][x];
                if (next_cell == null) {
                    map[this.y][this.x] = null;
                    map[y][x] = this;
                    [this.x, this.y] = [x, y];

                    this.dnk_offset = (this.dnk_offset + 1) % this.dnk.length;
                    this.dnk_offset = (this.dnk_offset + this.dnk[this.dnk_offset]) % this.dnk.length;
                }

                else if (next_cell instanceof Cell) {
                    if (next_cell.alive) {
                        this.dnk_offset = (this.dnk_offset + 2) % this.dnk.length;
                        this.dnk_offset = (this.dnk_offset + this.dnk[this.dnk_offset]) % this.dnk.length;
                    }
                    else {
                        this.dnk_offset = (this.dnk_offset + 3) % this.dnk.length;
                        this.dnk_offset = (this.dnk_offset + this.dnk[this.dnk_offset]) % this.dnk.length;
                    }
                }

                else if (next_cell instanceof Food) {
                    this.dnk_offset = (this.dnk_offset + 4) % this.dnk.length;
                    this.dnk_offset = (this.dnk_offset + this.dnk[this.dnk_offset]) % this.dnk.length;
                }

                else if (next_cell instanceof Wall) {
                    this.dnk_offset = (this.dnk_offset + 5) % this.dnk.length;
                    this.dnk_offset = (this.dnk_offset + this.dnk[this.dnk_offset]) % this.dnk.length;
                }
            }

            else {
                this.dnk_offset = (this.dnk_offset + 5) % this.dnk.length;
                this.dnk_offset = (this.dnk_offset + this.dnk[this.dnk_offset]) % this.dnk.length;
            }

            this.energy -= 5;
        }

        else if (31 <= this.dnk[this.dnk_offset] && this.dnk[this.dnk_offset] <= 40) {
            let d = num2dir(this.dir);
            let [x, y] = [this.x + d[0], this.y + d[1]];
            if ((0 <= x && x < map_width) && (0 <= y && y < map_height)) {
                let next_cell = map[y][x];
                if (next_cell == null) {
                    this.dnk_offset = (this.dnk_offset + 1) % this.dnk.length;
                    this.dnk_offset = (this.dnk_offset + this.dnk[this.dnk_offset]) % this.dnk.length;
                }

                else if (next_cell instanceof Cell) {
                    if (next_cell.alive)
                        this.dnk_offset = (this.dnk_offset + 2) % this.dnk.length;
                    else
                        this.dnk_offset = (this.dnk_offset + 3) % this.dnk.length;
                    
                    this.dnk_offset = (this.dnk_offset + this.dnk[this.dnk_offset]) % this.dnk.length;
                }

                else if (next_cell instanceof Food) {
                    this.dnk_offset = (this.dnk_offset + 3) % this.dnk.length;
                    this.dnk_offset = (this.dnk_offset + this.dnk[this.dnk_offset]) % this.dnk.length;
                }

                else if (next_cell instanceof Wall) {
                    this.dnk_offset = (this.dnk_offset + 4) % this.dnk.length;
                    this.dnk_offset = (this.dnk_offset + this.dnk[this.dnk_offset]) % this.dnk.length;
                }
            }

            else {
                this.dnk_offset = (this.dnk_offset + 4) % this.dnk.length;
                this.dnk_offset = (this.dnk_offset + this.dnk[this.dnk_offset]) % this.dnk.length;
            }

            this.energy -= 1;
        }

        else if (41 <= this.dnk[this.dnk_offset] && this.dnk[this.dnk_offset] <= 50) {
            let d = num2dir(this.dir);
            let [x, y] = [this.x + d[0], this.y + d[1]];
            if ((0 <= x && x < map_width) && (0 <= y && y < map_height)) {
                let next_cell = map[y][x];
                if (next_cell == null) {
                    map[this.y][this.x] = null;
                    map[y][x] = this;
                    [this.x, this.y] = [x, y];

                    this.dnk_offset = (this.dnk_offset + 1) % this.dnk.length;
                    this.dnk_offset = (this.dnk_offset + this.dnk[this.dnk_offset]) % this.dnk.length;
                }

                else if (next_cell instanceof Cell) {
                    if (next_cell.alive) {
                        this.dnk_offset = (this.dnk_offset + 2) % this.dnk.length;
                        this.energy += next_cell.energy;
                    }
                    else {
                        this.dnk_offset = (this.dnk_offset + 3) % this.dnk.length;
                        this.energy += 40;
                    }
                    this.dnk_offset = (this.dnk_offset + this.dnk[this.dnk_offset]) % this.dnk.length;

                    map[this.y][this.x] = null;
                    map[y][x] = this;
                    [this.x, this.y] = [x, y];
                }

                else if (next_cell instanceof Food) {
                    this.dnk_offset = (this.dnk_offset + 3) % this.dnk.length;
                    this.dnk_offset = (this.dnk_offset + this.dnk[this.dnk_offset]) % this.dnk.length;

                    this.energy += 30

                    map[this.y][this.x] = null;
                    map[y][x] = this;
                    [this.x, this.y] = [x, y];
                }

                else if (next_cell instanceof Wall) {
                    this.dnk_offset = (this.dnk_offset + 4) % this.dnk.length;
                    this.dnk_offset = (this.dnk_offset + this.dnk[this.dnk_offset]) % this.dnk.length;
                }
            }

            else {
                this.dnk_offset = (this.dnk_offset + 4) % this.dnk.length;
                this.dnk_offset = (this.dnk_offset + this.dnk[this.dnk_offset]) % this.dnk.length;
            }
        }

        else if (51 <= this.dnk[this.dnk_offset] && this.dnk[this.dnk_offset] <= 63) {
            this.dnk_offset = (this.dnk_offset + 1) % this.dnk.length;
            this.dnk_offset = (this.dnk_offset + this.dnk[this.dnk_offset]) % this.dnk.length;
        } 

        this.dnk_offset = (this.dnk_offset + 1) % this.dnk.length;

        if (this.energy < 1) {
            this.alive = false;
        }

        if (this.energy > 200) {
            this.dnk_offset = (this.dnk_offset + 1) % this.dnk.length;
            let d = num2dir((this.dir + this.dnk[this.dnk_offset]) % 7);
            let [x, y] = [this.x + d[0], this.y + d[1]];
            if ((0 <= x && x < map_width) && (0 <= y && y < map_height)) {
                if (map[y][x] == null) {
                    this.energy /= 2;
                    map[y][x] = new Cell(x, y, this.energy, this.dnk);
                }
            }
        }
    }

    mutation() {
        if (Math.random() < 0.1) {
            this.dnk[Math.floor(Math.random() * this.dnk.length)] = Math.floor(Math.random() * 64)
        }
    }
}

//let dnk = [21, 6, 11, 10, 6, 5, 0, 63, 5, 11, 63, 1, 41]
let dnk = [];
for (let i = 0; i < 64; i++) {
    dnk.push(Math.floor(Math.random() * 64));
}
map[0][0] = new Cell(0, 0, 100, dnk)

function createFood() {
    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[i].length; j++) {
            if (map[i][j] == null && Math.random() * 100 < 0.1)
                map[i][j] = new Food(j, i);
        }
    }
}

function update() {
    let cc = 0;
    let cd = 0;

    ctx.clearRect(0, 0, width, height);

    for (let i of map) {
        for (let j of i) {
            if (j) {
                if (j instanceof Cell) {
                    if (j.alive) {
                        j.step();
                        j.mutation();
                        cc++;
                    }
                    else
                        cd++;
                }
                
                if (j)
                    j.draw();
            }
        }
    }

    cells_count.innerHTML = "Живых клеток: " + cc;
    cells_dead_count.innerHTML = "Мертвых клеток: " + cd;

    createFood()

    requestAnimationFrame(update);
}

update();