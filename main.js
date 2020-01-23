import * as THREE from './build/three.module.js';
import { OrbitControls } from './lib/jsm/controls/OrbitControls.js';
import { OBJLoader } from './lib/jsm/loaders/OBJLoader.js';
import { DDSLoader } from './lib/jsm/loaders/DDSLoader.js';
import { MTLLoader } from './lib/jsm/loaders/MTLLoader.js';

let container;
let camera, scene, renderer, controls;

let animateID;

let OBJ_load, OBJ_load_Compar;
let OBJ_selected = new Map();
let domEvents = new THREE.Vector2();
const ObjectsHasClickedChangeColor = new Map();

function init() {
    //sectionCanvas
    container = document.createElement('section');
    container.setAttribute("id", "canvas");
    document.body.appendChild(container);

    //scene
    scene = new THREE.Scene();
    const light = new THREE.AmbientLight(0xFFFFFF, 0.5);
    scene.add(light); // soft white light

    //camera
    camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 500);
    camera.up.set(0, 0, 1);
    camera.position.set(1.450894241788153, -89.90155770575996, 15.921198155969478);
    scene.add(camera);

    //grid
    // const grid = new THREE.GridHelper(50, 50, 0xffffff, 0x555555);
    // grid.rotateOnAxis(new THREE.Vector3(1, 0, 0), 90 * (Math.PI / 180));
    // scene.add(grid);

    //renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    // renderer.setClearColor();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    THREE.Loader.Handlers.add(/\.dds$/i, new DDSLoader());

    //loader and Controler
    loaderObject();
    controler();

    //events
    domEvents = new THREEx.DomEvents(camera, renderer.domElement);

}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderizating.render();
}

function loaderObject() {
    //progress
    const onProgress = function (xhr) {
        if (xhr.lengthComputable) {
            var percentComplete = xhr.loaded / xhr.total * 100;
            console.log(Math.round(percentComplete, 2) + '% downloaded');
        }
    };
    //error
    const onError = function () { console.log("error") };

    const loaderMTLL = new MTLLoader();
    loaderMTLL.load('./obj/dest2.mtl', function (materials) {
        materials.preload();
        const loaderOBJ = new OBJLoader();
        // const newMaterial = new MeshBasicMaterial();
        console.log(materials.materials);
        loaderOBJ.setMaterials(materials);
        loaderOBJ.load('./obj/dest2.obj', function (object) {
            object.children.forEach((obj, index) => {
                if (!Array.isArray(obj.material)) {
                    let newMaterial = new THREE.MeshPhongMaterial(obj.material);
                    obj.material = newMaterial;
                } else {
                    obj.material.forEach((mat, indexMat) => {
                        let newMaterial = new THREE.MeshPhongMaterial(mat.material);
                        mat.material = newMaterial;
                    });
                }
            });
            //console.log(object);
            OBJ_load = object;
            scene.add(OBJ_load);
            eventsObject.doubleClickSetColor();
            issue.load();
            renderizating.render();
        }, onProgress, onError);

    });
}

function controler() {
    //controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.addEventListener('change', renderizating.render);
    controls.target.set(0, 0, 0);
    controls.update();
    window.addEventListener('resize', onWindowResize, false);
}

function loadUtilScript() {
    issue.init();
    compare.init();
    eventsObject.init();
}

const issue = {
    new: () => {
        //elements
        const domNewIssue = document.getElementById("new-issue");

        //events
        domNewIssue.addEventListener("click", function (event) {
            OBJ_selected.forEach((key, element) => {
                if (element != undefined) {
                    issue.textLoad(element.id);
                    $("#bim-modal").modal('show');
                }

            });

        });
    },
    save: () => {
        const bimSave = document.getElementById("bim-save");
        const textAreaBIM = document.getElementById("textAreaBIM");

        bimSave.addEventListener("click", event => {
            OBJ_selected.forEach((element, key) => {
                element.material.color.setHex(ObjectsHasClickedChangeColor.get(element.id));
                ObjectsHasClickedChangeColor.delete(element.id);

                let objDetails = {
                    name: element.name,
                    text: textAreaBIM.value,
                    position: {
                        x: camera.position.x,
                        y: camera.position.y,
                        z: camera.position.z
                    },
                    rotation: {
                        x: camera.rotation.x,
                        y: camera.rotation.y,
                        z: camera.rotation.z
                    },
                    quaternion: {
                        x: camera.quaternion.x,
                        y: camera.quaternion.y,
                        z: camera.quaternion.z,
                        w: camera.quaternion.w
                    },
                    controls: {
                        x: controls.position0.x,
                        y: controls.position0.y,
                        z: controls.position0.z
                    }
                };

                localStorage.setItem(element.id, JSON.stringify(objDetails));


            });
            $("#bim-modal").modal('hide');

            textAreaBIM.value = "";
            OBJ_selected.clear();
            issue.load();
            renderizating.render();

        }, false);
    },
    textLoad: (id) => {
        const textAreaBIM = document.getElementById("textAreaBIM");
        let objToJson = JSON.parse(localStorage.getItem(id));
        textAreaBIM.value = objToJson != null ? objToJson.text : "";
        renderizating.render();
    },
    load: () => {
        const listIssues = document.getElementById("list-issue");
        listIssues.innerHTML = "";
        Object.keys(localStorage).forEach((element) => {
            if (localStorage[element] != undefined && localStorage[element] != "") {
                let objLocalStorage = JSON.parse(localStorage[element]);
                $("#list-issue").append("<div class='m-3 cursor-click' id='" + element + "'><i class='fas fa-exclamation-circle mr-2'></i> <b>" + objLocalStorage.name + "</b>: " + objLocalStorage.text + "</div>");
                document.getElementById(element).addEventListener("click", function () {
                    //clear selecteds; 
                    OBJ_selected.clear();

                    //object selected
                    const objectById = scene.getObjectById(Number(this.id), true);

                    //localstorage and parser
                    const localJson = localStorage.getItem(this.id);
                    const localOBJ = JSON.parse(localJson);

                    //matrix and name
                    const name = localOBJ.name;
                    const position = {
                        x: localOBJ.position.x,
                        y: localOBJ.position.y,
                        z: localOBJ.position.z
                    };
                    const rotation = {
                        x: localOBJ.rotation.x,
                        y: localOBJ.rotation.y,
                        z: localOBJ.rotation.z
                    };
                    const quaternion = {
                        x: localOBJ.quaternion.x,
                        y: localOBJ.quaternion.y,
                        z: localOBJ.quaternion.z,
                        w: localOBJ.quaternion.w
                    }
                    eventsObject.unSetColorAll();

                    if (!ObjectsHasClickedChangeColor.has(element)) {
                        if (ObjectsHasClickedChangeColor.size < 1) {

                            OBJ_selected.set(objectById.id, objectById);
                            console.log(objectById);
                            eventsObject.setColor(objectById);

                            camera.position.copy(position);
                            camera.rotation.x = rotation.x;
                            camera.rotation.y = rotation.y;
                            camera.rotation.z = rotation.z;

                            camera.quaternion.x = quaternion.x;
                            camera.quaternion.y = quaternion.y;
                            camera.quaternion.z = quaternion.z;
                            camera.quaternion.w = quaternion.w;

                            camera.lookAt(0, 0, 0);

                            controls.position0.copy(localOBJ.controls);

                            console.log(controls);
                            //update render and camera
                            controls.update()
                        }
                    } else {
                        eventsObject.unSetColor(objectById);
                    }
                });

            }

        });

    },
    clearAll: ()=>{
        const element = document.getElementById("clear-all");
        element.addEventListener("click",function(event){
            localStorage.clear();
            issue.load();
        });
    },
    clear: ()=>{

    },
    init: function () {
        this.new();
        this.save();
        this.load();
        this.clearAll();
    }
}
const eventsObject = {
    setColor: function (element) {
        ObjectsHasClickedChangeColor.set(element.id, element.material.color.getHex());
        element.material.color.setHex(0xF9F926);
        renderizating.render();
    },
    unSetColor: function (element) {
        element.material.color.setHex(ObjectsHasClickedChangeColor.get(element.id));
        ObjectsHasClickedChangeColor.delete(element.id);
        OBJ_selected.delete(element.id);
        renderizating.render();
    },
    unSetColorAll: function () {
        OBJ_load.children.forEach((element) => {
            if (ObjectsHasClickedChangeColor.get(element.id) != undefined) {
                element.material.color.setHex(ObjectsHasClickedChangeColor.get(element.id));
                ObjectsHasClickedChangeColor.delete(element.id);
                renderizating.render();
            }
        });
        ObjectsHasClickedChangeColor.clear();
        OBJ_selected.clear();
    },
    doubleClickSetColor: function () {
        if (OBJ_load != undefined) {
            OBJ_load.children.forEach((element, index) => {
                domEvents.addEventListener(element, 'dblclick', function (event) {
                    if (element.material.color != undefined) {
                        if (!ObjectsHasClickedChangeColor.has(element.id)) {
                            OBJ_selected.set(element.id, element);
                            eventsObject.setColor(element);
                        } else {
                            eventsObject.unSetColor(element);
                        }
                    }
                }, false)
            });
        }
    },
    show_hide: function () {
        //element
        const element = document.getElementById("visibility");

        element.addEventListener("click", function (event) {
            if (OBJ_selected != undefined) {
                OBJ_selected.forEach((element, key) => {
                    // element.visible = element.visible ? false : true
                    element.visible = false
                });
                renderizating.render();
            }
        });

    },
    show: function () {
        OBJ_load.children.forEach((element, key) => {
                    element.visible =  true
        });
        renderizating.render();

    },
    auto_rotate: function () {
        const rotate = document.getElementById('auto-rotate');
        rotate.addEventListener("click", function (event) {
            if (controls.autoRotate == true) {
                controls.autoRotate = false;
                window.cancelAnimationFrame(animateID);
            } else {
                controls.autoRotate = true;
                controls.autoRotateSpeed = 5.0;
                renderizating.animate();
            }

        });
    },
    clean: function (){
        //elements
     const element =  document.getElementById("clean");

     element.addEventListener("click", function(event){
         eventsObject.show();
         eventsObject.unSetColorAll();
     });
    },
    init: function () {
        eventsObject.show_hide();
        eventsObject.auto_rotate();
        eventsObject.clean();
    }

};

const renderizating = {
    render: () => {
        renderer.render(scene, camera);
    },
    animate: () => {
        animateID = requestAnimationFrame(renderizating.animate);
        controls.update();
        renderizating.render();
    }
}

const compare = {
    load: () => {
        //progress
        const onProgress = function (xhr) {
            if (xhr.lengthComputable) {
                var percentComplete = xhr.loaded / xhr.total * 100;
                console.log(Math.round(percentComplete, 2) + '% downloaded');
            }
        };
        //error
        const onError = function () { console.log("error") };

        const loaderOBJ = new OBJLoader();
        loaderOBJ.load('./obj/dest2.obj', function (object) {
            OBJ_load_Compar = object;
            OBJ_load_Compar.children.forEach((element, index) => {
                console.log(element.material);
                if (!Array.isArray(element.material)) {
                    element.material.color.setHex(0xb200009e);
                } else {
                    element.material.forEach((mat) => {
                        mat.color.setHex(0xb200009e);
                    });
                }
            });
            OBJ_load_Compar.position.set(0, 0, 0);
            scene.add(OBJ_load_Compar);
            renderizating.render();

        }, onProgress, onError);
    },
    init: () => {
        //elements
        const domComparar = document.getElementById("comparar");
        const domRemoverComparar = document.getElementById("remover-compar");
        const compararEixoX = document.getElementById("comparar-eixo-x");

        //event
        domComparar.addEventListener("click", (eventNotThis) => {
            compare.load();
        });
        domRemoverComparar.addEventListener("click", (eventNotThis) => {
            scene.remove(OBJ_load_Compar);
            renderizating.render();
        });
        compararEixoX.addEventListener("change", function (event) {
            if (OBJ_load_Compar != undefined) {
                OBJ_load_Compar.position.y = this.value;
                renderizating.render();
            }
        });
    }
}

window.onload = () => {
    init();
    loadUtilScript();
};

