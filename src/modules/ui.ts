export function el<K extends keyof HTMLElementTagNameMap>(tag: K, opts?: {
    classes?: string[];
    text?: string;
    attrs?: Record<string, string>;
}): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    if (opts?.classes) node.classList.add(...opts.classes);
    if (opts?.text) node.textContent = opts.text;
    if (opts?.attrs) for (const [k, v] of Object.entries(opts.attrs)) node.setAttribute(k, v);
    return node;
}

export function clear(node: HTMLElement) {
    while (node.firstChild) node.removeChild(node.firstChild);
}
