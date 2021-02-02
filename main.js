let [width, height] = [360, 300];

// 0 - обычный, 1 - кол-во энергии
let draw_type = 0;
let fast_mode = false;

let max_energy = 1000;
let energy_to_double = 700;


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


let [map_width, map_height] = [36, 30];
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

    фотосинтез          		 0..10
    поворот             		 11..15
    шаг                 		 16..21
    посмотреть          	   	 21..26
    сьесть              	 	 27..31
    узнать кол-во энергии		 32..35
    узнать высоту 				 36..39
    поделится энергией с другими 40..43
    узнать кто впереди			 44..50
    безусловный переход			 51..63
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
                    this.energy / max_energy * 255 + ",0,0)");
            }
        }
        else
            rect(x * cell_width, y * cell_height, cell_width, cell_height, "gray");
        let d = num2dir(this.dir);
        line(x * cell_width + (cell_width >> 1), y * cell_height + (cell_height >> 1),
             x * cell_width + (cell_width >> 1) + d[0] * (cell_width >> 1), y * cell_height + (cell_height >> 1) + d[1] * (cell_height >> 1),
             "white")
    }

    step(id) {
        if (0 <= this.dnk[this.dnk_offset] && this.dnk[this.dnk_offset] <= 10) {
            this.energy += (map_height - this.y - 1) / map_height * 20;
            this.dnk_offset = (this.dnk_offset + 1) % this.dnk.length;
        }

        else if (11 <= this.dnk[this.dnk_offset] && this.dnk[this.dnk_offset] <= 15) {
            this.dnk_offset = (this.dnk_offset + 1) % this.dnk.length;
            this.dir = (this.dir + this.dnk[this.dnk_offset]) % 8;
            this.energy -= 1;
            this.dnk_offset = (this.dnk_offset + 1) % this.dnk.length;
        }

        else if (16 <= this.dnk[this.dnk_offset] && this.dnk[this.dnk_offset] <= 20) {
            let d = num2dir(this.dir);
            let [x, y] = [this.x + d[0], this.y + d[1]];
            if ((0 <= x && x < map_width) && (0 <= y && y < map_height)) {
                let next_cell = map[y][x];
                if (next_cell == null) {
                    map[this.y][this.x] = null;
                    map[y][x] = this;
                    [this.x, this.y] = [x, y];

                    let dnk_offset = (this.dnk_offset + 1) % this.dnk.length;
                    this.dnk_offset = (this.dnk_offset + this.dnk[dnk_offset]) % this.dnk.length;
                    
                    this.energy -= 5;
                }

                else if (next_cell instanceof Cell) {
                    if (next_cell.alive) {
                        let dnk_offset = (this.dnk_offset + 2) % this.dnk.length;
                        this.dnk_offset = (this.dnk_offset + this.dnk[dnk_offset]) % this.dnk.length;
                    }
                    else {
                        let dnk_offset = (this.dnk_offset + 3) % this.dnk.length;
                        this.dnk_offset = (this.dnk_offset + this.dnk[dnk_offset]) % this.dnk.length;
                    }
                }

                else if (next_cell instanceof Food) {
                    let dnk_offset = (this.dnk_offset + 4) % this.dnk.length;
                    this.dnk_offset = (this.dnk_offset + this.dnk[dnk_offset]) % this.dnk.length;
                }

                else if (next_cell instanceof Wall) {
                    let dnk_offset = (this.dnk_offset + 5) % this.dnk.length;
                    this.dnk_offset = (this.dnk_offset + this.dnk[dnk_offset]) % this.dnk.length;
                }
            }

            else {
                let dnk_offset = (this.dnk_offset + 5) % this.dnk.length;
                this.dnk_offset = (this.dnk_offset + this.dnk[dnk_offset]) % this.dnk.length;
            }
        }

        else if (21 <= this.dnk[this.dnk_offset] && this.dnk[this.dnk_offset] <= 26) {
            let d = num2dir(this.dir);
            let [x, y] = [this.x + d[0], this.y + d[1]];
            if ((0 <= x && x < map_width) && (0 <= y && y < map_height)) {
                let next_cell = map[y][x];
                if (next_cell == null) {
                    let dnk_offset = (this.dnk_offset + 1) % this.dnk.length;
                    this.dnk_offset = (this.dnk_offset + this.dnk[dnk_offset]) % this.dnk.length;
                }

                else if (next_cell instanceof Cell) {
                    if (next_cell.alive) {
                        let dnk_offset = (this.dnk_offset + 2) % this.dnk.length;
                        this.dnk_offset = (this.dnk_offset + this.dnk[dnk_offset]) % this.dnk.length;
                    }
                    else {
                        let dnk_offset = (this.dnk_offset + 3) % this.dnk.length;
                        this.dnk_offset = (this.dnk_offset + this.dnk[dnk_offset]) % this.dnk.length;
                    }
                }

                else if (next_cell instanceof Food) {
                    let dnk_offset = (this.dnk_offset + 5) % this.dnk.length;
                    this.dnk_offset = (this.dnk_offset + this.dnk[dnk_offset]) % this.dnk.length;
                }

                else if (next_cell instanceof Wall) {
                    let dnk_offset = (this.dnk_offset + 5) % this.dnk.length;
                    this.dnk_offset = (this.dnk_offset + this.dnk[dnk_offset]) % this.dnk.length;
                }
            }

            else {
                let dnk_offset = (this.dnk_offset + 5) % this.dnk.length;
                this.dnk_offset = (this.dnk_offset + this.dnk[dnk_offset]) % this.dnk.length;
            }

            this.energy -= 1;
        }

        else if (27 <= this.dnk[this.dnk_offset] && this.dnk[this.dnk_offset] <= 31) {
            let d = num2dir(this.dir);
            let [x, y] = [this.x + d[0], this.y + d[1]];
            if ((0 <= x && x < map_width) && (0 <= y && y < map_height)) {
                let next_cell = map[y][x];
                if (next_cell == null) {
                    map[this.y][this.x] = null;
                    map[y][x] = this;
                    [this.x, this.y] = [x, y];

                    let dnk_offset = (this.dnk_offset + 1) % this.dnk.length;
                    this.dnk_offset = (this.dnk_offset + this.dnk[dnk_offset]) % this.dnk.length;
                }

                else if (next_cell instanceof Cell) {
                    if (next_cell.alive) {
                        let dnk_offset = (this.dnk_offset + 2) % this.dnk.length;
                        this.dnk_offset = (this.dnk_offset + this.dnk[dnk_offset]) % this.dnk.length;
                        this.energy += next_cell.energy;
                    }
                    else {
                        let dnk_offset = (this.dnk_offset + 3) % this.dnk.length;
                        this.dnk_offset = (this.dnk_offset + this.dnk[dnk_offset]) % this.dnk.length;
                        this.energy += 40;
                    }

                    map[this.y][this.x] = null;
                    map[y][x] = this;
                    [this.x, this.y] = [x, y];
                }

                else if (next_cell instanceof Food) {
                    let dnk_offset = (this.dnk_offset + 4) % this.dnk.length;
                    this.dnk_offset = (this.dnk_offset + this.dnk[dnk_offset]) % this.dnk.length;

                    this.energy += 30

                    map[this.y][this.x] = null;
                    map[y][x] = this;
                    [this.x, this.y] = [x, y];
                }

                else if (next_cell instanceof Wall) {
                    let dnk_offset = (this.dnk_offset + 5) % this.dnk.length;
                    this.dnk_offset = (this.dnk_offset + this.dnk[dnk_offset]) % this.dnk.length;
                }
            }

            else {
                let dnk_offset = (this.dnk_offset + 5) % this.dnk.length;
                this.dnk_offset = (this.dnk_offset + this.dnk[dnk_offset]) % this.dnk.length;
            }
        }
        
        else if (32 <= this.dnk[this.dnk_offset] && this.dnk[this.dnk_offset] <= 35) {
	        if (this.energy < max_energy * 0.5) {
		        let dnk_offset = (this.dnk_offset + 1) % this.dnk.length;
		        this.dnk_offset = (this.dnk_offset + this.dnk[dnk_offset]) % this.dnk.length;
		    }
		    else {
			    let dnk_offset = (this.dnk_offset + 2) % this.dnk.length;
			    this.dnk_offset = (this.dnk_offset + this.dnk[dnk_offset]) % this.dnk.length;
		    }
        }
        
        else if (36 <= this.dnk[this.dnk_offset] && this.dnk[this.dnk_offset] <= 39) {
            if (this.y < map_height * 0.5) {
		        let dnk_offset = (this.dnk_offset + 1) % this.dnk.length;
		        this.dnk_offset = (this.dnk_offset + this.dnk[dnk_offset]) % this.dnk.length;
		    }
		    else {
			    let dnk_offset = (this.dnk_offset + 2) % this.dnk.length;
			    this.dnk_offset = (this.dnk_offset + this.dnk[dnk_offset]) % this.dnk.length;
		    }
        }
        
		else if (40 <= this.dnk[this.dnk_offset] && this.dnk[this.dnk_offset] <= 43) {
			let neighbors = [];
			for (let i = 0; i < 8; i++) {
				let d = num2dir(i);
				let [x, y] = [this.x + d[0], this.y + d[1]];
				if (0 <= x && x < map_width) {
					if (0 <= y && y < map_height) {
						if (map[y][x] instanceof Cell)
							neighbors.push(map[y][x]);
					}
				}
			}
			this.energy /= neighbors.length + 1;
			for (let i of neighbors) {
				i.energy += this.energy
			}
		}
        
        else if (44 <= this.dnk[this.dnk_offset] && this.dnk[this.dnk_offset] <= 50) {
        	let d = num2dir(this.dir);
        	let [x, y] = [this.x + d[0], this.y + d[1]];
        	if (0 <= x && x < map_width) {
					if (0 <= y && y < map_height) {
        			if (map[y][x] instanceof Cell) {
        				let diff = 0;
        				for (let i = 0; i < this.dnk.length; i++) {
        					if (map[y][x].dnk[i] != this.dnk[i]) {
        						diff++;
        						if (diff > 3) break;
        					}
        				}
        				if (diff > 3) {
        					let dnk_offset = (this.dnk_offset + 2) % this.dnk.length;
		      		  		this.dnk_offset = (this.dnk_offset + this.dnk[dnk_offset]) % this.dnk.length;
        				}
        				else {
        					let dnk_offset = (this.dnk_offset + 1) % this.dnk.length;
		        			this.dnk_offset = (this.dnk_offset + this.dnk[dnk_offset]) % this.dnk.length;
        				}
        			}
				}
        	}
        }
        
        else if (51 <= this.dnk[this.dnk_offset] && this.dnk[this.dnk_offset] <= 63) {
            let dnk_offset = (this.dnk_offset + 1) % this.dnk.length;
            this.dnk_offset = (this.dnk_offset + this.dnk[dnk_offset]) % this.dnk.length;
        }


        if (this.energy < 1) {
            this.alive = false;
        }
        
        if (this.energy > max_energy) this.energy = max_energy;

        if (this.energy > energy_to_double) {
            this.dnk_offset = (this.dnk_offset + 1) % this.dnk.length;
            for (let i = 0; i < 8; i++) {
	            let d = num2dir((this.dir + this.dnk[this.dnk_offset] + i) % 8);
	            let [x, y] = [this.x + d[0], this.y + d[1]];
	            if ((0 <= x && x < map_width) && (0 <= y && y < map_height)) {
	                if (map[y][x] == null) {
	                    this.energy = this.energy >> 1;
	                    map[y][x] = new Cell(x, y, this.energy, this.dnk);
	                    return;
	                }
	            }
            }
        }
    }

    mutation() {
        if (Math.random() * 100 < 1) {
            this.dnk[Math.floor(Math.random() * this.dnk.length)] = Math.floor(Math.random() * 64)
        }
    }
}

let dnk = [16, 15, 6, 9, 9, 6, 11, 63, 13, 27, 12, 12, 12, 12, 12, 16, 6, 6, 6, 6, 6];
//let dnk = [];
for (let i = 0; i < 64-dnk.length; i++) {
	dnk.push(0);
}
map[0][0] = new Cell(0, 0, 500, dnk)

function createFood() {
    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[i].length; j++) {
            if (map[i][j] == null && Math.random() * 100 < 0.1)
                map[i][j] = new Food(j, i);
        }
    }
}

function inArray(arr, val) {
	for (let i of arr) {
		if (i == val) return true;
	}
	
	return false;
}

let frames = 0;

function update() {
    let cc = 0;
    let cd = 0;
    
    let sc = [];

    ctx.clearRect(0, 0, width, height);

    for (let i of map) {
        for (let j of i) {
            if (j) {
                if (j instanceof Cell && !inArray(sc, j)) {
                    if (j.alive) {
                        j.step();
                        j.mutation();
                        cc++;
                    }
                    else
                        cd++;
                     
                    sc.push(j);
                }
                
                if (j)
                    j.draw();
            }
        }
    }

    cells_count.innerHTML = "Живых клеток: " + cc;
    cells_dead_count.innerHTML = "Мертвых клеток: " + cd;

    createFood()
    
    frames++;
	
	if (fast_mode && frames % 10 != 0) {
		update();
	}
	else
	    requestAnimationFrame(update);
}

update();