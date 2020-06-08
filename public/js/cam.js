let $ = require('jquery')
let jimp = require('jimp')
let potrace = require('potrace')

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

        // Load img
        jimp.read('public/' + img_src).then(image => {
            // Crop with given coords
            image.crop(crop_x, crop_y, crop_w, crop_h)
                .scaleToFit(1000, jimp.AUTO, jimp.RESIZE_BEZIER)
                .threshold({
                    max: 170
                }).invert()
                .convolute([
                    [1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1]
                ]).invert()

            image.getBuffer(jimp.AUTO, (e, src) => {
                var params = {
                    color: '#ffffff',
                    threshold: 250
                }

                let img_cropped = new Image()

                // Width and height of image
                let w = image.getWidth()
                let h = image.getHeight()

                $('#heightmap').attr({
                    width: w,
                    height: h
                })

                // Trace lines into svg
                potrace.trace(src, params, function (err, svg) {

                    img_cropped.onload = e => {
                        let canvas = $('#heightmap')
                        let ctx = $('#heightmap')[0].getContext('2d')

                        // Draw the svg
                        ctx.drawImage(img_cropped, 0, 0)

                        // Load rasterized svg into jimp
                        jimp.read(ctx).then((err, _img) => {
                            if (err) throw err

                            _img.convolute([
                                [1, 1, 1],
                                [1, -8, 1],
                                [1, 1, 1]
                            ])

                            img.getBuffer(jimp.AUTO, (e, src) => {
                                // redraw
                                ctx.clearRect(0, 0, w, h)
                                ctx.drawImage(src, 0, 0)

                                // Get imagedata
                                let img_data = ctx.getImageData(0, 0, w, h).data

                                console.log("img_data", img_data)

                                let heightmap = [, ]

                                // Make 1-bit bitmap
                                for (let x = 0; x < w; x++) {
                                    for (let y = 0; y < h; y++) {
                                        let red = y * (w * 4) + x * 4

                                        let r = img_data[red]
                                        let g = img_data[red + 1]
                                        let b = img_data[red + 2]
                                        let a = img_data[red + 3]

                                        heightmap[x, y] = r + g + b + a > 0 ? 1 : 0
                                    }
                                }

                                // Fill shapes
                                let inside_shape = false
                                for (let x = 0; x < w; x++) {
                                    for (let y = 0; y < h; y++) {
                                        let v = heightmap[x, y]

                                        if (v == 1 && !inside_shape) inside_shape = true
                                        if (v == 0 && inside_shape) inside_shape = true
                                    }
                                }

                                $('#heightmap').addClass('active')
                            })
                        })


                    }

                    img_cropped.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
                })
            })
        })
    })
})