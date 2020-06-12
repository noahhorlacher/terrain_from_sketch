let THREE = require('three')
import {Water} from '../../node_modules/three/examples/jsm/objects/Water.js'
import {Sky} from '../../node_modules/three/examples/jsm/objects/Sky.js'
import {OrbitControls} from '../../node_modules/three/examples/jsm/controls/OrbitControls.js'

let sun_parameters, sky, sky_uniforms, cube_render_target, cube_camera, scene, light, geometry_water, water, controls, camera
let group_terrain, material_terrain, mesh_terrain, renderer

function init_rendering(geometry_terrain, display_terrain) {
    sun_parameters = {
        distance: 400,
        inclination: 0.49,
        azimuth: 0.205
    }

    // Skybox
    sky = new Sky()

    sky_uniforms = sky.material.uniforms

    sky_uniforms['turbidity'].value = 10
    sky_uniforms['rayleigh'].value = 2
    sky_uniforms['luminance'].value = 1
    sky_uniforms['mieCoefficient'].value = 0.005
    sky_uniforms['mieDirectionalG'].value = 0.8

    cube_render_target = new THREE.WebGLCubeRenderTarget(512, {
        format: THREE.RGBFormat,
        generateMipmaps: true,
        minFilter: THREE.LinearMipmapLinearFilter
    })

    cube_camera = new THREE.CubeCamera(0.1, 1, cube_render_target)

    scene = new THREE.Scene()
    scene.background = cube_render_target

    light = new THREE.DirectionalLight(0xffffff, 0.5)
    light.position.set(5.0, 10.0, 7.5)
    light.lookAt(0, 0, 0)
    scene.add(light)

    geometry_water = new THREE.PlaneBufferGeometry(display_terrain.width, display_terrain.depth)

    water = new Water(
        geometry_water, {
            textureWidth: 256,
            textureHeight: 256,
            waterNormals: new THREE.TextureLoader().load('textures/waternormals.jpg', function (texture) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping
                texture.repeat = 8
            }),
            alpha: 1.0,
            sunDirection: light.position.clone().normalize(),
            sunColor: 0xffffff,
            waterColor: 0x001e0f,
            distortionScale: 3.7,
            fog: scene.fog !== undefined
        }
    )

    group_terrain = new THREE.Group()
    group_terrain.position.set(0.0, 0.0, 0.0)

    material_terrain = new THREE.MeshPhongMaterial({
        color: 0x88ff88,
        reflectivity: 0.1,
        flatShading: false
    })

    mesh_terrain = new THREE.Mesh(geometry_terrain, material_terrain)
    mesh_terrain.position.x = -display_terrain.width / 2.0
    mesh_terrain.position.y = -display_terrain.plateau_height / 2.0
    mesh_terrain.position.z = -display_terrain.depth / 2.0

    water.rotation.x = -Math.PI / 2

    group_terrain.add(mesh_terrain)

    scene.add(group_terrain)
    scene.add(water)

    renderer = new THREE.WebGLRenderer({
        antialias: true
    })

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.001, 10000)
    camera.position.set(0, display_terrain.absolute_height * 3, display_terrain.depth)
    camera.lookAt(0, 0, 0)

    controls = new OrbitControls(camera, renderer.domElement)
    controls.maxPolarAngle = Math.PI * 0.495
    controls.target.set(0, 0, 0)
    controls.minDistance = 40.0
    controls.maxDistance = 200.0
    controls.update()

    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)
}

function update_sun() {
    let theta = Math.PI * (sun_parameters.inclination - 0.5)
    let phi = 2 * Math.PI * (sun_parameters.azimuth - 0.5)

    light.position.x = sun_parameters.distance * Math.cos(phi);
    light.position.y = sun_parameters.distance * Math.sin(phi) * Math.sin(theta)
    light.position.z = sun_parameters.distance * Math.sin(phi) * Math.cos(theta)

    sky.material.uniforms['sunPosition'].value = light.position.copy(light.position)
    water.material.uniforms['sunDirection'].value.copy(light.position).normalize()

    cube_camera.update(renderer, sky)
}

function animate() {
    requestAnimationFrame(animate)

    water.material.uniforms['time'].value += 1.0 / 60.0;

    renderer.render(scene, camera)
}

function render_geometry(geometry_terrain, display_terrain) {
    init_rendering(geometry_terrain, display_terrain)
    update_sun()
    animate()
}

export {
    render_geometry
}