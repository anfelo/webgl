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

let gui = new dat.gui.GUI();
let currentItem = "";
const initialItem = "hello-triangle";

const items = [
    {
        title: "Hello Triangle",
        slug: "hello-triangle",
        onClick: () => {
            gui.hide();
            helloTriangle();
        }
    },
    {
        title: "Hello Rectangle",
        slug: "hello-rectangle",
        onClick: () => {
            gui.hide();
            helloRectangle();
        }
    },
    {
        title: "Hello Colored Triangle",
        slug: "hello-colored-triangle",
        onClick: () => {
            gui.destroy();
            gui = new dat.gui.GUI();
            return helloColoredTriangle(gui);
        }
    },
    {
        title: "Hello Multiple Rectangles",
        slug: "hello-multiple-rectangles",
        onClick: () => {
            gui.hide();
            helloMultipleRectangles();
        }
    },
    {
        title: "2d Transforms",
        slug: "2d-transforms",
        onClick: () => {
            gui.destroy();
            gui = new dat.gui.GUI();
            transform2D(gui);
        }
    },
    {
        title: "2d Transforms Matrix",
        slug: "2d-transforms-matrix",
        onClick: () => {
            gui.destroy();
            gui = new dat.gui.GUI();
            transformMatrix2D(gui);
        }
    },
    {
        title: "2d Textures",
        slug: "2d-textures",
        onClick: () => {
            gui.destroy();
            gui = new dat.gui.GUI();
            texture2D(gui);
        }
    },
    {
        title: "Going 3d",
        slug: "going-3d",
        onClick: () => {
            gui.destroy();
            gui = new dat.gui.GUI();
            going3D(gui);
        }
    },
    {
        title: "Texture 3d",
        slug: "texture-3d",
        onClick: () => {
            gui.destroy();
            gui = new dat.gui.GUI();
            texture3D(gui);
        }
    },
    {
        title: "Camera 3d",
        slug: "camera-3d",
        onClick: () => {
            gui.destroy();
            gui = new dat.gui.GUI();
            camera3D(gui);
        }
    },
    {
        title: "Directional Light",
        slug: "directional-light",
        onClick: () => {
            gui.destroy();
            gui = new dat.gui.GUI();
            directionalLight(gui);
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
