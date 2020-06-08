let $ = require('jquery')
let jimp = require('jimp')
let dataUriToBuffer = require('data-uri-to-buffer')
require('floodfill')
let THREE = require('three')

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
            image.crop(crop_x, crop_y, crop_w, crop_h)
                .scaleToFit(1000, jimp.AUTO, jimp.RESIZE_BEZIER)
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
                    return data + String.fromCharCode(byte);
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

                    // redraw
                    ctx.clearRect(0, 0, w, h)
                    ctx.drawImage(img_cropped, 0, 0)

                    // Filling Shapes
                    ctx.fillStyle = '#000000'
                    ctx.fillFlood(0, 0, 8)

                    // Erosion
                    jimp.read(dataUriToBuffer(canvas[0].toDataURL())).then((img_filled) => {
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
                            .scaleToFit(512, jimp.AUTO, jimp.RESIZE_NEAREST_NEIGHBOR)

                        img_filled.getBuffer(jimp.AUTO, (e, img_eroded) => {
                            let _img_eroded = new Image()

                            let _s = img_eroded.reduce((data, byte) => {
                                return data + String.fromCharCode(byte);
                            }, '')
                            let _b64 = btoa(_s)

                            _img_eroded.src = 'data:image/png;base64,' + _b64

                            _img_eroded.onload = e => {
                                // redraw
                                ctx.clearRect(0, 0, w, h)
                                ctx.drawImage(_img_eroded, 0, 0)

                                // Generate heightmap from canvas
                                let heightmap = [,]

                                for (let x = 0; x < w; x++) {
                                    for (let y = 0; y < h; y++) {
                                        if (ctx.getImageData(x, y, 1, 1).data[0] > 0) {
                                            heightmap[x][y] = 1
                                        } else {
                                            heightmap[x][y] = 0
                                        }
                                    }
                                }

                                // Generate terrain 3D model
                                let camera, scene, renderer;
                                let geometry, material, mesh;

                                const terrainScale = 10
                                const plateau_height = 100

                                init();
                                animate();

                                function init() {

                                    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10)
                                    camera.position.z = 1

                                    scene = new THREE.Scene()

                                    geometry = new THREE.Geometry()

                                    for (let y = 0; y < heightmap[0].length; y++) {
                                        for (let x = 0; x < heightmap.length - 1; x++) {
                                            // push upwards triangle
                                            geometry.vertices.push(
                                                new THREE.Vector3(x * terrainScale, heightmap[x][y] * plateau_height, y * terrainScale)
                                            )
                                        }
                                    }

                                    let _w = heightmap.length - 1
                                    let _h = heightmap[0].length - 1

                                    // Create faces from vertices
                                    for (let x = 0; x < _w; x++) {
                                        for (let y = 0; y < _h; y++) {
                                            // Downwards tri
                                            if (y != _h - 1) {
                                                geometry.faces.push(new THREE.Face3(x + (y * _w), x + 1 + (y * _w), x + ((y + 1) * _w)))
                                            }

                                            // Upwards tri
                                            if (y != 0) {
                                                geometry.faces.push(new THREE.Face3(x + (y * _w), x + 1 + ((y-1) * _w), x + 1 (y * _w)))
                                            }
                                        }
                                    }

                                    geometry.computeFaceNormals()

                                    mesh = new THREE.Mesh(geometry, new THREE.MeshNormalMaterial)

                                    mesh.position.z = -(terrainScale*(_h+1))
                                    mesh.rotation.y = -Math.PI * .5

                                    scene.add(mesh)

                                    renderer = new THREE.WebGLRenderer({
                                        antialias: true
                                    })

                                    renderer.setSize(window.innerWidth, window.innerHeight)
                                    document.body.appendChild(renderer.domElement)

                                }

                                function animate() {

                                    requestAnimationFrame(animate)

                                    mesh.rotation.x += 0.01
                                    mesh.rotation.y += 0.02

                                    renderer.render(scene, camera)

                                }

                                $('#heightmap').addClass('active')
                            }
                        })
                    })
                }
            })
        })
    })
})