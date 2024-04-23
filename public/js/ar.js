import * as THREE from 'three'
import {ARButton} from "three/examples/jsm/webxr/ARButton"
import {DragonBonesLoader} from "./DragonBonesLoader"
import {ThreeFactory} from "@flyskypie/dragonbones-threejs"

let scene, camera, renderer
let chara
let anchoredObject = {
    anchor: null,
    object: null
}
let xrViewerSpace, xrLocalSpace, xrHitTestSource
let pointerHitTestResult, pointer, cube

const skeJson = '../res/zeru/Sprite_Zeru_ske.json'
const texJson = '../res/zeru/Sprite_Zeru_tex.json'
const texPng = '../res/zeru/Sprite_Zeru_tex.png'

const requiredFeatures = [ 'hit-test', 'dom-overlay']
const optionalFeatures = ['plane-detection', 'anchors']

init()
animate()

function init()
{
    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight)

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    })

    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight)
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
    })

    renderer.xr.enabled = true

    document.body.appendChild(renderer.domElement)

    pointer = new THREE.Mesh(
        new THREE.RingGeometry( 0.15, 0.2, 32 ).rotateX( - Math.PI / 2 ),
        new THREE.MeshBasicMaterial()
    );
    pointer.matrixAutoUpdate = false
    pointer.visible = false
    scene.add( pointer )

    const loader = new DragonBonesLoader()
    loader.load('armatureName', skeJson, texJson, texPng,
        (result) => {
            chara = result

            scene.add(chara)
            chara.animation.play('Zeru_AR_Camera', 0)
            chara.scale.set(.0005, -.0005, .0005)
            //chara.position.z = -5
            chara.position.y = 0.4

            pointer.add(chara)

            /*chara.position.setFromMatrixPosition(pointer.matrixWorld)
            chara.quaternion.setFromRotationMatrix(pointer.matrixWorld)*/

            //pointerObjects = chara
        })

    setupAR()
}

function animate()
{
    renderer.setAnimationLoop(render)
}

function render(t, frame)
{
    ThreeFactory.factory.dragonBones.advanceTime(-1.0)

    if(frame) {
        renderer.alpha = true
        let pose = frame.getViewerPose(xrLocalSpace)

        if(xrHitTestSource && pose)
        {
            const hitTestResult = frame.getHitTestResults(xrHitTestSource)

            if(hitTestResult.length)
            {
                pointerHitTestResult = hitTestResult[0]

                pointer.visible = true
                pointer.matrix.fromArray(pointerHitTestResult.getPose(xrLocalSpace).transform.matrix)
            }
            else
            {
                pointer.visible = false
            }
        }
    }

    if(anchoredObject.object !== null)
    {
        const anchor = anchoredObject.anchor
        const anchorObject = anchoredObject.object
        // only update the object's position if it's still in the list
        // of frame.trackedAnchors
        if (frame.trackedAnchors.has(anchor)) {
            const anchorPose = frame.getPose(anchor.anchorSpace, xrLocalSpace)
            anchorObject.matrix.fromArray(anchorPose.transform.matrix)
        }
        const anchorPose = frame.getPose(anchor.anchorSpace, xrLocalSpace)
        anchorObject.matrix.fromArray(anchorPose.transform.matrix)
    }

    else {
        renderer.alpha = false
    }

    renderer.render(scene, camera)
}

function setupAR()
{
    document.body.appendChild(ARButton.createButton( renderer, {
        requiredFeatures: [ 'hit-test', 'dom-overlay'],
        optionalFeatures: ['plane-detection', 'anchors'],
        domOverlay: {root: document.body}
    }))

    renderer.xr.addEventListener('sessionstart', onStartARSession)
    renderer.xr.addEventListener('sessionend', onEndARSession)
}

function onStartARSession()
{
    const session = renderer.xr.getSession()
    session.requestReferenceSpace('viewer').then((refSpace) => {
        xrViewerSpace = refSpace

        session.requestHitTestSource({space: xrViewerSpace}).then((hitTestSource) => {
            xrHitTestSource = hitTestSource

            console.log(xrHitTestSource)
        })
    })

    session.requestReferenceSpace('local').then((refSpace) => {
        xrLocalSpace = refSpace
    })

    document.getElementById("place").style.display = 'block'
    document.getElementById("place").addEventListener('click', onSelect)

    document.getElementById('feature-list').style.display = 'block'

    const activeFeatures = session.enabledFeatures

    if(activeFeatures)
    {
        for (const feature of requiredFeatures) {
            const listElement = document.createElement('li')
            listElement.style.color = activeFeatures.includes(feature) ? 'green' : 'red'
            listElement.innerText = `Required: ${feature}`
            document.getElementById('feature-list').appendChild(listElement)
        }

        for (const feature of optionalFeatures) {
            const listElement = document.createElement('li')
            listElement.style.color = activeFeatures.includes(feature) ? 'green' : 'red'
            listElement.innerText = `Optional: ${feature}`
            document.getElementById('feature-list').appendChild(listElement)
        }
    }
    else {
        document.getElementById('feature-list').append('<li> Failed to get feature list! </li>')
    }
}

function onEndARSession()
{
    anchoredObject.anchor = null
    anchoredObject.object = null

    if(xrHitTestSource !== null) {
        xrHitTestSource.cancel()
        xrHitTestSource = null
    }
    console.log('Finishing Session')

    document.getElementById("place").style.display = 'none'
    document.getElementById('feature-list').style.display = 'none'
}

function onSelect()
{
    if(chara === undefined)
        return

    if(!pointer.visible)
        return

    pointerHitTestResult.createAnchor().then((anchor) => {
        scene.attach(chara)
        anchoredObject.anchor = anchor
        anchoredObject.object = chara
    }, (error) => {
        console.error("Could not create anchor: " + error);
    })

    document.getElementById("place").removeEventListener('click', onSelect)
    document.getElementById("place").addEventListener('click', onReset)
    document.getElementById("place").innerText = 'RESET'
}

function onReset()
{
    if(cube === undefined)
        return

    cube.position.setFromMatrixPosition(pointer.matrixWorld)
    cube.quaternion.setFromRotationMatrix(pointer.matrixWorld)
    pointer.attach(cube)

    anchoredObject.anchor = null
    anchoredObject.object = null

    document.getElementById("place").removeEventListener('click', onReset)
    document.getElementById("place").addEventListener('click', onSelect)
    document.getElementById("place").innerText = 'PLACE'
}