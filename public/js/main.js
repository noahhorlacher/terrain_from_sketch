let $ = require('jquery')
let Cropper = require('cropperjs')
let jimp = require('jimp')
let Terrain = require('../../experimental-3d-terrain-generator/index.js').Terrain
import {
    render_geometry
} from './render.js'

let display_terrain

$(document).ready(() => {
    let terrain_settings = {
        heightmap_path: __dirname + '/test.jpg',
        display_element: document.getElementById('steps')
    }

    display_terrain = new Terrain(512, 10, 40, 512, 0.01, 0.2)

    $('#display').attr('src', terrain_settings.heightmap_path)

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

        jimp.read(terrain_settings.heightmap_path, (e, image) => {
            image.crop(crop_x, crop_y, crop_w, crop_h)

            image.getBuffer(jimp.AUTO, (e, img_buffer) => {
                init_terrain(img_buffer)
            })
        })
    })
})

async function init_terrain(img_buffer) {
    let geom = await display_terrain.from_image(img_buffer)
    let three_geom = await display_terrain.to_threejs(await geom)
    render_geometry(three_geom, display_terrain)
}