let $ = require('jquery')
let jimp = require('jimp')
let dataUriToBuffer = require('data-uri-to-buffer')
require('floodfill')
let isosurface = require('isosurface-generator')
let ndarray = require('ndarray')
let THREE = require('three')
import {
    Water
} from '../../node_modules/three/examples/jsm/objects/Water.js'
import {
    Sky
} from '../../node_modules/three/examples/jsm/objects/Sky.js'
import {
    OrbitControls
} from '../../node_modules/three/examples/jsm/controls/OrbitControls.js'

let tumult = require('tumult')

let img_src = 'test.jpg'

$(document).ready(() => {

    $('#display').attr('src', img_src)
    let crop_x, crop_y, crop_w, crop_h

    const cropper = new Cropper($('#display')[0], {
        viewMode: 3,
        scalable: false,
        zoomable: false,
        crop(event) {
            // Update crop coords
            crop_x = event.detail.x
            crop_y = event.detail.y
            crop_h = event.detail.height
            crop_w = event.detail.width
        }
    })

    $('#cropconfirm').on('click', e => {
        $('#cropconfirm').off('click').removeClass('active')
        $('#cropper').removeClass('active')

        console.log("loading image")

        // Load img
        jimp.read('public/' + img_src).then(image => {

            // Crop with given coords
            console.log("jimp processing")
            image.crop(Math.round(crop_x), Math.round(crop_y), Math.round(crop_w), Math.round(crop_h))
                .threshold({
                    max: 170
                }).invert()
                .convolute([
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
                ]).invert()

            console.log('filling shapes')
            image.getBuffer(jimp.AUTO, (e, src) => {
                let img_cropped = new Image()

                let _s = src.reduce((data, byte) => {
                    return data + String.fromCharCode(byte)
                }, '')
                let _b64 = btoa(_s)

                img_cropped.src = 'data:image/png;base64,' + _b64

                img_cropped.onload = e => {
                    // Width and height of image
                    let w = image.getWidth()
                    let h = image.getHeight()

                    $('#heightmap').attr({
                        width: w,
                        height: h
                    })

                    let canvas = $('#heightmap')
                    let ctx = $('#heightmap')[0].getContext('2d')
                    $('#heightmap').addClass('active')

                    // redraw
                    ctx.clearRect(0, 0, w, h)
                    ctx.drawImage(img_cropped, 0, 0)

                    // Filling Shapes
                    ctx.fillStyle = '#000000'
                    ctx.fillFlood(0, 0, 8)

                    // Erosion
                    jimp.read(dataUriToBuffer(canvas[0].toDataURL())).then((img_filled) => {
                        console.log('making heightmap')
                        img_filled
                            .invert()
                            .convolute([
                                [1, 1, 1],
                                [1, 1, 1],
                                [1, 1, 1]
                            ])
                            .convolute([
                                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
                            ]).invert()

                        w = img_filled.getWidth()
                        h = img_filled.getHeight()

                        $('canvas').attr({
                            'width': w,
                            'height': h
                        })

                        img_filled.getBuffer(jimp.AUTO, (e, img_eroded) => {
                            let _img_eroded = new Image()

                            let _s = img_eroded.reduce((data, byte) => {
                                return data + String.fromCharCode(byte)
                            }, '')
                            let _b64 = btoa(_s)

                            _img_eroded.src = 'data:image/png;base64,' + _b64

                            _img_eroded.onload = e => {
                                // Redrwa
                                ctx.clearRect(0, 0, w, h)
                                ctx.drawImage(_img_eroded, 0, 0)
                                
                                console.log('creating density map')

                                // Height offset
                                const plateau_height = 10

                                // Height of the generated perlin noise terrain
                                const terrain_height = 40

                                // Absolute height of the terrain
                                const absolute_height = plateau_height+terrain_height

                                // Highest side length
                                const higher_dim = w >= h ? w : h

                                // How many pixels to sample from the heightmap
                                const resolution = 512

                                // Sample heightmap every n pixels
                                const sample_frequency = higher_dim/resolution
                                
                                // Global scale of the terrain
                                const terrain_scale = 1.0 / (higher_dim / resolution)

                                // Scale of the perlin noise
                                const noise_scale = 0.01

                                // When something is matter and when not
                                const iso = 0.2

                                // Convert 2d heightmap from canvas to 3d voxel grid
                                let density_map = ndarray(new Float32Array(w * (terrain_height + 1) * h), [w, terrain_height + 1, h])
                                let noise = new tumult.Perlin3()

                                for (let x = 0; x < w; x++) {
                                    for (let y = 0; y < absolute_height + 1; y++) {
                                        for (let z = 0; z < h; z++) {
                                            if (y < plateau_height) {
                                                // Generate plateau
                                                density_map.set(x, y, z, ctx.getImageData(x, z, 1, 1).data[0] / 255.0)
                                            } else if (y >= plateau_height) {
                                                // mask perlin noise to generate surface terrain
                                                let mask = ctx.getImageData(Math.round(x*sample_frequency), Math.round(z*sample_frequency), 1, 1).data[0] == 255 ? 1.0 : 0.0

                                                let noise_val = noise.octavate(4, x * noise_scale * sample_frequency, y * noise_scale * sample_frequency, z * noise_scale * sample_frequency)
                                                let height_multiplier = 1.0 - ((y - plateau_height) / terrain_height)
                                                let density = mask * (noise_val + (height_multiplier * 2.0 - 1.0))

                                                density = Math.min(Math.max(density, 0.0), 1.0)
                                                density_map.set(x, y, z, density)
                                            } else {
                                                // Add empty layer on top
                                                density_map.set(x, y, z, 0.0)
                                            }
                                        }
                                    }
                                }

                                // Generate terrain 3D model
                                let camera, scene, renderer, light, controls
                                let geometry_terrain, mesh_terrain, group_terrain, material_terrain
                                let geometry_water, group_water, water

                                // Skybox
                                let sky = new Sky()

                                let uniforms = sky.material.uniforms

                                uniforms['turbidity'].value = 10
                                uniforms['rayleigh'].value = 2
                                uniforms['luminance'].value = 1
                                uniforms['mieCoefficient'].value = 0.005
                                uniforms['mieDirectionalG'].value = 0.8

                                let parameters = {
                                    distance: 400,
                                    inclination: 0.49,
                                    azimuth: 0.205
                                }
                                let cubeRenderTarget = new THREE.WebGLCubeRenderTarget(512, {
                                    format: THREE.RGBFormat,
                                    generateMipmaps: true,
                                    minFilter: THREE.LinearMipmapLinearFilter
                                })
                                let cubeCamera = new THREE.CubeCamera(0.1, 1, cubeRenderTarget)

                                function updateSun() {
                                    var theta = Math.PI * (parameters.inclination - 0.5)
                                    var phi = 2 * Math.PI * (parameters.azimuth - 0.5)

                                    light.position.x = parameters.distance * Math.cos(phi);
                                    light.position.y = parameters.distance * Math.sin(phi) * Math.sin(theta)
                                    light.position.z = parameters.distance * Math.sin(phi) * Math.cos(theta)

                                    sky.material.uniforms['sunPosition'].value = light.position.copy(light.position)
                                    water.material.uniforms['sunDirection'].value.copy(light.position).normalize()

                                    cubeCamera.update(renderer, sky)
                                }

                                init()
                                updateSun()
                                animate()

                                function init() {
                                    scene = new THREE.Scene()
                                    scene.background = cubeRenderTarget

                                    light = new THREE.DirectionalLight(0xffffff, 0.5)
                                    light.position.set(5.0, 10.0, 7.5)
                                    light.lookAt(0, 0, 0)
                                    scene.add(light)

                                    geometry_terrain = new THREE.Geometry()
                                    geometry_water = new THREE.PlaneBufferGeometry(w * terrain_scale, h * terrain_scale)

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


                                    let __mesh

                                    // The isosurface mesh
                                    console.log('creating mesh geometry')

                                    for (let data of isosurface(density_map, iso)) {
                                        __mesh = data
                                    }

                                    console.log(__mesh)

                                    for (let vertice of __mesh.positions) {
                                        geometry_terrain.vertices.push(new THREE.Vector3(vertice[0] * terrain_scale, vertice[1] * terrain_scale, vertice[2] * terrain_scale))
                                    }

                                    for (let cell of __mesh.cells) {
                                        geometry_terrain.faces.push(new THREE.Face3(cell[0], cell[1], cell[2]))
                                    }
                                    geometry_terrain.computeFaceNormals()
                                    geometry_terrain.computeVertexNormals(true)

                                    group_water = new THREE.Group()
                                    group_water.position.set(0.0, 0.0, 0.0)

                                    group_terrain = new THREE.Group()
                                    group_terrain.position.set(0.0, 0.0, 0.0)

                                    material_terrain = new THREE.MeshPhongMaterial({
                                        color: 0x88ff88,
                                        reflectivity: 0.1,
                                        flatShading: false
                                    })

                                    mesh_terrain = new THREE.Mesh(geometry_terrain, material_terrain)
                                    mesh_terrain.position.x = ((-w * terrain_scale) / 2.0)
                                    mesh_terrain.position.y = -(plateau_height / 2.0)
                                    mesh_terrain.position.z = ((-h * terrain_scale) / 2.0)

                                    water.rotation.x = -Math.PI / 2

                                    group_terrain.add(mesh_terrain)
                                    group_water.add(water)

                                    scene.add(group_terrain)
                                    scene.add(group_water)

                                    renderer = new THREE.WebGLRenderer({
                                        antialias: true
                                    })

                                    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.001, 10000)
                                    camera.position.set(0, terrain_height * 3, h)
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

                                function animate() {
                                    requestAnimationFrame(animate)

                                    water.material.uniforms['time'].value += 1.0 / 60.0;

                                    renderer.render(scene, camera)
                                }
                            }
                        })
                    })
                }
            })
        })
    })
})