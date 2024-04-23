import {Loader} from 'three'
import * as THREE from "three"
import {ThreeFactory} from "@flyskypie/dragonbones-threejs"

class DragonBonesLoader extends Loader {

    loadedResources = {}

    constructor(manager) {
        super(manager)
    }

    load(charaName, skeJsonUrl, texJsonUrl, texPngUrl, onLoad, onProgress, onError) {

        const sequential = async () => {

            this.loadedResources[skeJsonUrl] = await loadResources(skeJsonUrl, (e) => {
                onError(e)
                throw e
            })
            this.loadedResources[texJsonUrl] = await loadResources(texJsonUrl, (e) => {
                onError(e)
                throw e
            })
            this.loadedResources[texPngUrl] = await loadResources(texPngUrl, (e) => {
                onError(e)
                throw e
            })

            return  this.loadedResources
        }

        sequential().then(() => {
            const factory = ThreeFactory.factory
            factory.parseDragonBonesData(this.loadedResources[skeJsonUrl])
            factory.parseTextureAtlasData(this.loadedResources[texJsonUrl], this.loadedResources[texPngUrl])

            const armatureDisplay = factory.buildArmatureDisplay(charaName)

            if(armatureDisplay === null)
                return

            onLoad(armatureDisplay)

            return armatureDisplay
        })

    }
}

function loadResources(resource, onError)
{
    return new Promise(function (resolve) {
        const ext = resource.split('.').pop()
        if (ext === 'dbbin') {
            const loader = new THREE.FileLoader();
            loader.setResponseType("arraybuffer");
            loader.load(resource, (result) => {
                resolve(result)
            }, null,
            (e) => {
                onError(e)
            })
        } else if (ext === 'png') {
            const loader = new THREE.TextureLoader();
            loader.load(resource, (result) => {
                resolve(result)
            }, null,
            (e) => {
                onError(e)
            })
        } else {
            const loader = new THREE.FileLoader();
            loader.setResponseType("json");
            loader.load(resource, (result) => {
                resolve(result)
            }, null,
            (e) => {
                onError(e)
            })
        }
    })
}

export {DragonBonesLoader}