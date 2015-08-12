var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update });

function preload() {

    game.load.image('space', 'assets/space.png');
    game.load.image('star', 'assets/star.png');
    game.load.atlasJSONHash('fragments', 'assets/fragments.png', 'assets/fragments.json');
    game.load.atlasJSONHash('ship', 'assets/shipsheet.png', 'assets/shipsheet.json');
    game.load.image('moon', 'assets/moon.png');

}

// Globals
var ANGULAR_VELOCITY = 3;
var MAX_ACCELERATION = 200;
var GRAVITY = 6000000;
var SHIP_SCALE = 0.25;

var fragment_map = {
    WIDTH: 3,
    HEIGHT: 3,
    FRAGMENT_PREFIX: 'fragment_',
    FRAGMENT_SUFFIX: '.png',
    
    get_fragment: function(idx1, idx2){
        var pos = idx1 * 3 + idx2;
        return this.FRAGMENT_PREFIX + pos.toString() + this.FRAGMENT_SUFFIX; 
    },
}

// The player (ship)
var player;

// Fragments group
var fragments;

// The player's collision group
var player_collision_group;

// Game cursors
var cursors;

// The planets group
var planets;

// The planets collision group
var planet_collision_group;

// These are the fragments that the ship breaks into.
var fragment_collision_group;

var sum_of_da_forces = {x:0, y:0};

function planetary_body(xpos, ypos){
    this.xforce = 0;
    this.yforce = 0;
    this.xpos = xpos;
    this.ypos = ypos;
}

function planetary_body(sprite_name, scale, sprite_diameter){
    this.name = sprite_name;
    this.scale = scale;
    this.radius = sprite_diameter * scale * 0.5;
}

var MOON = new planetary_body('moon', 0.25, 250);

function explode(ship_body, planet_body){
    ship_body.sprite.kill();
    var xpos = ship_body.x;
    var ypos = ship_body.y;
    var xvel = ship_body.velocity.x;
    var yvel = ship_body.velocity.y;
    fragment = fragments.create(xpos, ypos, 'fragments', fragment_map.get_fragment(0, 0));
    game.physics.p2.enable(fragment);
    fragment.body.setCollisionGroup(fragment_collision_group);
    fragment.body.collides(planet_collision_group);
    fragment.scale.setTo(SHIP_SCALE, SHIP_SCALE);
    fragment.body.angle = ship_body.angle;
    fragment.body.velocity.x = xvel;
    fragment.body.velocity.y = yvel;
}

function add_ship_to_game(phaser_game){
    
    ship = phaser_game.add.sprite(60, 60, 'ship', 'ship.png');

    // Make it a bit smaller.
    ship.scale.setTo(SHIP_SCALE, SHIP_SCALE);

    // We need to enable physics on the ship.
    phaser_game.physics.p2.enable(ship);
    
    // Add ship to collision group
    ship.body.setCollisionGroup(player_collision_group);
    ship.body.collides(planet_collision_group, explode, this);

    // Make ship collide with the world's boundaries.
    ship.body.collideWorldBounds = true;

    // Set the point of rotation to be in the middle of the body.
    ship.anchor.setTo(.5, .5);

    return ship;
}

function accelerateToObject(obj1, obj2) {
    // Get the angle between the two bodies.
    var angle = Math.atan2(obj2.y - obj1.y, obj2.x - obj1.x);
    
    // Get the square of the x and y offsets.
    var x_dist_squared = Math.pow(obj2.x - obj1.x, 2);
    var y_dist_squared = Math.pow(obj2.y - obj1.y, 2);
    var dist = 5000 + (x_dist_squared + y_dist_squared);

    var new_x_force = Math.cos(angle) * GRAVITY * (1/dist);
    var new_y_force = Math.sin(angle) * GRAVITY * (1/dist);

    sum_of_da_forces.x += new_x_force;
    sum_of_da_forces.y += new_y_force; 
    
}

function add_planet(group, xpos, ypos, body){
    var planet = group.create(xpos, ypos, body.name);
    game.physics.p2.enable(planet);
    planet.scale.setTo(body.scale, body.scale); 
    planet.enableBody = true;
    planet.body.setCircle(body.radius);
    planet.body.static = true;
    planet.body.setCollisionGroup(planet_collision_group);
    planet.body.collides(player_collision_group);
}


function create() {
    game.world.setBounds(0, 0, 3000, 600);
    
    //  We're going to be using physics, so enable the P2 Physics system
    game.physics.startSystem(Phaser.Physics.P2JS);

    // Enable collisions
    game.physics.p2.setImpactEvents(true);
    
    // Make the collision groups
    player_collision_group = game.physics.p2.createCollisionGroup();
    planet_collision_group = game.physics.p2.createCollisionGroup();
    fragment_collision_group = game.physics.p2.createCollisionGroup();

    game.physics.p2.updateBoundsCollisionGroup();

    //  A simple background for our game
    game.add.tileSprite(0, 0, 3000, 600, 'space');

    // The player and his settings
    player = add_ship_to_game(game); 
    
    // Follow the player around the map with the camera.
    game.camera.follow(player);

    // Add planet group
    planets = game.add.group();

    // Add the fragments.
    fragments = game.add.group();

    // Add a planet
    add_planet(planets, 800, 400, MOON);
    add_planet(planets, 400, 300, MOON);

    //  Our controls.
    cursors = game.input.keyboard.createCursorKeys();
    console.log(player.frameName);
}

function accelerateShipToPlanet(p){
    accelerateToObject(player, p); 
}

function update() {
    planets.forEachAlive(accelerateShipToPlanet, this); 
    player.body.force.x += sum_of_da_forces.x;
    player.body.force.y += sum_of_da_forces.y;
 
    if (cursors.left.isDown)
    {
        //  Move to the left
        player.body.angularVelocity = -ANGULAR_VELOCITY;

    }
    else if (cursors.right.isDown)
    {
        //  Move to the right
        player.body.angularVelocity = ANGULAR_VELOCITY;
    }
    else
    {
        player.body.angularVelocity = 0;
    }

    if (cursors.up.isDown)
    {
        player.body.thrust(MAX_ACCELERATION);
    }

    sum_of_da_forces.x = 0;
    sum_of_da_forces.y = 0;
}
