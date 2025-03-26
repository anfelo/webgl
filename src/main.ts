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
import { pointLight } from "./point-light";
import { spotLight } from "./spot-light";
import { multipleObjectsScene } from "./multiple-objects-scene";
import { textureLight3D } from "./3d-texture-light";
import { model3DLoading } from "./model-3d-loading";
import { shaderFunctions } from "./shader-functions";

let gui = new dat.GUI();
let animManager: { handle: number } = { handle: null };
let currentItem: string | null = "";
const initialItem = "hello-triangle";

const canvas2D = document.getElementById("canvas-2d") as HTMLCanvasElement;
const canvas3D = document.getElementById("canvas-3d") as HTMLCanvasElement;

const useCanvas = (canvas: HTMLCanvasElement) => {
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
            gui = new dat.GUI();
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
        title: "Shader Functions",
        slug: "shader-functions",
        onClick: () => {
            gui.destroy();
            gui = new dat.GUI();
            useCanvas(canvas2D);
            shaderFunctions(canvas2D, gui);
        }
    },
    {
        title: "2D Transforms",
        slug: "2d-transforms",
        onClick: () => {
            gui.destroy();
            gui = new dat.GUI();
            useCanvas(canvas2D);
            transform2D(canvas2D, gui);
        }
    },
    {
        title: "2D Transforms Matrix",
        slug: "2d-transforms-matrix",
        onClick: () => {
            gui.destroy();
            gui = new dat.GUI();
            useCanvas(canvas2D);
            transformMatrix2D(canvas2D, gui);
        }
    },
    {
        title: "2D Textures",
        slug: "2d-textures",
        onClick: () => {
            gui.destroy();
            gui = new dat.GUI();
            useCanvas(canvas2D);
            texture2D(canvas2D, gui);
        }
    },
    {
        title: "Going 3D",
        slug: "going-3d",
        onClick: () => {
            gui.destroy();
            gui = new dat.GUI();
            useCanvas(canvas3D);
            going3D(canvas3D, gui);
        }
    },
    {
        title: "Texture 3D",
        slug: "texture-3d",
        onClick: () => {
            gui.destroy();
            gui = new dat.GUI();
            useCanvas(canvas3D);
            texture3D(canvas3D, gui);
        }
    },
    {
        title: "Camera 3D",
        slug: "camera-3d",
        onClick: () => {
            gui.destroy();
            gui = new dat.GUI();
            useCanvas(canvas3D);
            camera3D(canvas3D, gui);
        }
    },
    {
        title: "Directional Light",
        slug: "directional-light",
        onClick: () => {
            gui.destroy();
            gui = new dat.GUI();
            useCanvas(canvas3D);
            directionalLight(canvas3D, gui);
        }
    },
    {
        title: "Point Light",
        slug: "point-light",
        onClick: () => {
            gui.destroy();
            gui = new dat.GUI();
            useCanvas(canvas3D);
            pointLight(canvas3D, gui);
        }
    },
    {
        title: "Spot Light",
        slug: "spot-light",
        onClick: () => {
            gui.destroy();
            gui = new dat.GUI();
            useCanvas(canvas3D);
            spotLight(canvas3D, gui);
        }
    },
    {
        title: "Texture 3D with light",
        slug: "texture-3d-with-light",
        onClick: () => {
            gui.destroy();
            gui = new dat.GUI();
            useCanvas(canvas3D);
            textureLight3D(canvas3D, gui);
        }
    },
    {
        title: "Multiple Objects",
        slug: "multiple-objects",
        onClick: () => {
            gui.destroy();
            gui = new dat.GUI();
            useCanvas(canvas3D);
            multipleObjectsScene(canvas3D, gui, animManager);
        }
    },
    {
        title: "Model 3D Loading",
        slug: "model-3D-loading",
        onClick: () => {
            gui.destroy();
            gui = new dat.GUI();
            useCanvas(canvas3D);
            model3DLoading(canvas3D, gui, animManager);
        }
    }
];

window.addEventListener("resize", () => {
    const temp = currentItem;
    currentItem = null;
    selectMenuItem(temp);
});

document.querySelector("#playground-menu nav")!.innerHTML = `
    <ul>
        ${items.map(item => `<li><a href="#" class="menu-item" data-slug="${item.slug}">${item.title}</a></li>`).join("")}
    </ul>
`;

document.querySelectorAll(".menu-item").forEach(menuItem => {
    menuItem.addEventListener("click", () => {
        const slug = (menuItem as HTMLElement).dataset.slug;
        selectMenuItem(slug || null);
    });
});

function selectMenuItem(itemSlug: string | null) {
    if (currentItem === itemSlug) {
        return;
    }

    if (!itemSlug) {
        return;
    }

    const item = items.find(i => i.slug === itemSlug);

    if (item) {
        currentItem = itemSlug;

        // Cancel any animation and reset the handle
        if (animManager?.handle) {
            cancelAnimationFrame(animManager.handle);
            animManager.handle = null;
        }

        item.onClick();
    }
}

selectMenuItem(initialItem);
