import { helloTriangle } from "./hello-triangle";
import { helloRectangle } from "./hello-rectangle";
import { helloColoredTriangle } from "./hello-colored-triangle";
import { helloMultipleRectangles } from "./hello-multiple-rectangles";
import { transform2D } from "./2d-transforms";
import { texture2D } from "./2d-textures";
import { transformMatrix2D } from "./2d-transform-matrix";
import { going3D } from "./going-3d";
import { camera3D } from "./3d-camera";
import { texture3D } from "./3d-texture";
import { directionalLight } from "./directional-light";

import "./style.css";
import { pointLight } from "./point-light";

let gui = new dat.gui.GUI();
let currentItem = "";
const initialItem = "hello-triangle";

const canvas2D = document.getElementById("canvas-2d");
const canvas3D = document.getElementById("canvas-3d");

const useCanvas = canvas => {
    canvas2D.style.display = "none";
    canvas3D.style.display = "none";

    canvas.style.display = "block";
};

const items = [
    {
        title: "Hello Triangle",
        slug: "hello-triangle",
        onClick: () => {
            gui.hide();
            useCanvas(canvas2D);
            helloTriangle(canvas2D);
        }
    },
    {
        title: "Hello Rectangle",
        slug: "hello-rectangle",
        onClick: () => {
            gui.hide();
            useCanvas(canvas2D);
            helloRectangle(canvas2D);
        }
    },
    {
        title: "Hello Colored Triangle",
        slug: "hello-colored-triangle",
        onClick: () => {
            gui.destroy();
            gui = new dat.gui.GUI();
            useCanvas(canvas2D);
            helloColoredTriangle(canvas2D, gui);
        }
    },
    {
        title: "Hello Multiple Rectangles",
        slug: "hello-multiple-rectangles",
        onClick: () => {
            gui.hide();
            useCanvas(canvas2D);
            helloMultipleRectangles(canvas2D);
        }
    },
    {
        title: "2d Transforms",
        slug: "2d-transforms",
        onClick: () => {
            gui.destroy();
            gui = new dat.gui.GUI();
            useCanvas(canvas2D);
            transform2D(canvas2D, gui);
        }
    },
    {
        title: "2d Transforms Matrix",
        slug: "2d-transforms-matrix",
        onClick: () => {
            gui.destroy();
            gui = new dat.gui.GUI();
            useCanvas(canvas2D);
            transformMatrix2D(canvas2D, gui);
        }
    },
    {
        title: "2d Textures",
        slug: "2d-textures",
        onClick: () => {
            gui.destroy();
            gui = new dat.gui.GUI();
            useCanvas(canvas2D);
            texture2D(canvas2D, gui);
        }
    },
    {
        title: "Going 3d",
        slug: "going-3d",
        onClick: () => {
            gui.destroy();
            gui = new dat.gui.GUI();
            useCanvas(canvas3D);
            going3D(canvas3D, gui);
        }
    },
    {
        title: "Texture 3d",
        slug: "texture-3d",
        onClick: () => {
            gui.destroy();
            gui = new dat.gui.GUI();
            useCanvas(canvas3D);
            texture3D(canvas3D, gui);
        }
    },
    {
        title: "Camera 3d",
        slug: "camera-3d",
        onClick: () => {
            gui.destroy();
            gui = new dat.gui.GUI();
            useCanvas(canvas3D);
            camera3D(canvas3D, gui);
        }
    },
    {
        title: "Directional Light",
        slug: "directional-light",
        onClick: () => {
            gui.destroy();
            gui = new dat.gui.GUI();
            useCanvas(canvas3D);
            directionalLight(canvas3D, gui);
        }
    },
    {
        title: "Point Light",
        slug: "point-light",
        onClick: () => {
            gui.destroy();
            gui = new dat.gui.GUI();
            useCanvas(canvas3D);
            pointLight(canvas3D, gui);
        }
    }
];

window.addEventListener("resize", () => {
    const temp = currentItem;
    currentItem = null;
    selectMenuItem(temp);
});

document.querySelector("#playground-menu nav").innerHTML = `
    <ul>
        ${items.map(item => `<li><a href="#" class="menu-item" data-slug="${item.slug}">${item.title}</a></li>`).join("")}
    </ul>
`;

document.querySelectorAll(".menu-item").forEach(menuItem => {
    menuItem.addEventListener("click", () => {
        const slug = menuItem.dataset.slug;
        selectMenuItem(slug);
    });
});

function selectMenuItem(itemSlug) {
    if (currentItem === itemSlug) {
        return;
    }

    if (!itemSlug) {
        return;
    }

    const item = items.find(i => i.slug === itemSlug);

    if (item) {
        currentItem = itemSlug;
        item.onClick();
    }
}

selectMenuItem(initialItem);
