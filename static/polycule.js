'use strict';

class Element {
  /* 
    Do not define an events static member, because the static 
    variable would be inhereted and shared by the subclasses.
    Instead, we define a events variable on each subclass.
  */

  static states = {
    NONE: 0,
    SELECTED: 1,
    HOUSE: 2,
    EXTENDED: 3
  }

  constructor() {
    this.state = Element.states.NONE;
  }

  // selection stuff

  unselect() {
    if (this.state === Element.states.SELECTED) {
      this.state = Element.states.NONE;
    }
  }

  select() {
    this.state = Element.states.SELECTED;
  }

  selected() { return this.state === Element.states.SELECTED; }

  // Event stuff

  static addEvent(name, func) {
    this.events[name] = func
  }

  static addEvents(obj) {
    Object.entries(obj).forEach(
      ([name, f]) => this.addEvent(name, f)
    )
  }

  static attach_events(data_binding) {
    Object.entries(this.events).forEach(
      ([name, f]) => {
        console.log(`attach_events[${name}]`);
        data_binding.on(name, f);
      }
    )
  }
}

class Node extends Element {
  static events = {}

  constructor(id, point) {
    super();
    this.id = id;
    this.name = 'New ' + id;
    if (point) {
      this.x = point[0];
      this.y = point[1];
    } else {
      // todo: restore access to width & height
      this.x = 100 / 2;
      this.y = 100 / 2;
    }
    this.r = 12;
  }

  static from(json) {
    let node = Object.assign(new Node(0), json);
    return node;
  }

  // selected() { return this.state === Element.states.SELECTED; }

  under_label_point() { return [this.x, this.y + this.r * 2]; }

  toString() { return `${this.name}[${this.x.toFixed(2)},${this.y.toFixed(2)}]`; }

  setScale(amount) {
    if (amount != 1) {
      this.scale = amount;
    } else {
      delete this.scale;
    }
    console.log(`${this}.setScale(${amount}) -> ${this.scale}`);
  }

  // Draw Functions
  static set_radius(node) { return node.r; }
  static set_stroke(node) {
    return node.selected() ? '#00FFFF' : '#888';
  }
  static set_style(node) {
    return node.dashed ? 'fill:#ccc!important' : null;
  }
  static set_stroke_dash(node) { return node.dashed ? `${node.r / 4}, ${node.r / 4}` : null; }

  static set_text_y(node) { return - node.r - 2; }
  static set_text(node) { return node.name; }

  static transform(node) {
    // console.log(`Node.transform(${node})`);
    let xform = `translate(${node.x}, ${node.y})`;
    if (node.scale) {
      xform += ` scale(${node.scale})`;
    }
    return xform;
  }

  static update_svg(data_binding) {
    // console.log(`Node.update_svg`);
    data_binding.attr('transform', Node.transform)
    data_binding.select('text')
      .attr('y', Node.set_text_y)
      .text(Node.set_text);
    data_binding.select('circle')
      .attr('r', Node.set_radius)
      .attr('stroke', Node.set_stroke)
      .attr('style', Node.set_style)
      .attr('stroke-dasharray', Node.set_stroke_dash);
  }

  static create_svg(data_binding) {
    let node_elements = data_binding.enter()
      .append('g')
      .classed('node', true)
      .attr('transform', Node.transform);

    // circle (node) group
    node_elements.append('circle')
      .attr('r', Node.set_radius)
      .attr('stroke', Node.set_stroke)
      .attr('style', Node.set_style)
      .attr('stroke-dasharray', Node.set_stroke_dash);

    // show node IDs
    node_elements.append('text')
      .attr('class', 'node-name')
      .attr('text-anchor', 'middle')
      .attr('x', 0)
      .attr('y', Node.set_text_y)
      .text(Node.set_text);

    return node_elements;
  }
}

class Link extends Element {
  static events = {}

  constructor(source, target) {
    super();
    this.source = source;
    this.target = target;
    this.strength = 10;
    this.dashed = false;
    this.sourceText = "";
    this.targetText = "";
    this.centerText = "";
    this.sourceArrow = false;
    this.sourceArrow = false;
  }

  refreshNodeObjects(nodeList) {
    nodeList.forEach(
      node => {
        // stored version will have a deep copy, find proper references
        if (node.id === this.source.id) {
          this.source = node;
        }
        if (node.id === this.target.id) {
          this.target = node;
        }
      }
    )

    return this;
  }

  // selected() {
  //   return this == selected_link;
  // }

  name() {
    return `[${this.source.name}]->[${this.target.name}]`;
  }

  toString() { return this.name(); }

  static search_index(index, source, target) {
    var link = index.filter(function (l) {
      return (l.source === source && l.target === target) ||
        (l.source === target && l.target === source);
    });

    if (link.length) {
      return link[0];
    }

    return null;
  }

  static from(json) {
    return Object.assign(new Link(null, null), json);
  }

  // position setters
  static source_x(link) { return link.source.x; }
  static source_y(link) { return link.source.y; }
  static target_x(link) { return link.target.x; }
  static target_y(link) { return link.target.y; }
  static midpoint_x(link) { return (link.source.x + ((link.target.x - link.source.x) / 2)); }
  static midpoint_y(link) { return (link.source.y + ((link.target.y - link.source.y) / 2)); }
  static source_text_x(link) { return link.source.under_label_point()[0]; }
  static source_text_y(link) { return link.source.under_label_point()[1]; }
  static target_text_x(link) { return link.target.under_label_point()[0]; }
  static target_text_y(link) { return link.target.under_label_point()[1]; }

  // style setters
  static stroke(link) { return link.selected() ? '#00FFFF' : 'rgba(0,0,0,0.25)'; }
  static stroke_width(link) { return link.strength; }
  static stroke_dash(link) { return link.dashed ? `${link.strength / 1.5}, ${link.strength / 1.5}` : null; }
  static source_arrow(link) { return link.sourceArrow ? 'url(#arrow)' : ''; }
  static target_arrow(link) { return link.targetArrow ? 'url(#arrow)' : ''; }

  static update_line(data_binding) {
    data_binding
      .attr('x1', Link.source_x)
      .attr('y1', Link.source_y)
      .attr('x2', Link.target_x)
      .attr('y2', Link.target_y)
      .attr('stroke', Link.stroke)
      .attr('stroke-width', Link.stroke_width)
      .attr('stroke-dasharray', Link.stroke_dash)
      .attr('marker-start', Link.source_arrow)
      .attr('marker-end', Link.target_arrow);
  }

  static update_text(data_binding) {
    data_binding.select('.center-text')
      .attr('dx', Link.midpoint_x)
      .attr('dy', Link.midpoint_y)
      .text(function (d) { return d.centerText; });
    data_binding.select('.source-text')
      .attr('dx', Link.source_text_x)
      .attr('dy', Link.source_text_y)
      .text(function (d) { return d.sourceText; });
    data_binding.select('.target-text')
      .attr('dx', Link.target_text_x)
      .attr('dy', Link.target_text_y)
      .text(function (d) { return d.targetText; });
  }

  static update_svg(data_binding) {
    Link.update_line(data_binding.select('line'));
    Link.update_text(data_binding);
  }

  static create_svg(data_binding) {
    var path_elements = data_binding.enter()
      .append('g')
      .classed('link', true);

    const markerBoxSize = 3;
    path_elements.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', [0, 0, markerBoxSize, markerBoxSize])
      .attr('refX', markerBoxSize / 2 + 1)
      .attr('refY', markerBoxSize / 2)
      .attr('markerWidth', markerBoxSize)
      .attr('markerHeight', markerBoxSize)
      .attr('orient', 'auto-start-reverse')
      .append('path')
      .attr('d', `M ${markerBoxSize / 2} ${markerBoxSize / 2} 0 ${markerBoxSize / 4} 0 ${markerBoxSize * 3 / 4} ${markerBoxSize / 2} ${markerBoxSize / 2}`)
      .attr('fill', 'rgba(0,0,0,0.25)')

    Link.update_line(path_elements.append('line'));

    path_elements.append('text').attr('class', 'center-text meaning hidden');
    path_elements.append('text').attr('class', 'source-text meaning hidden');
    path_elements.append('text').attr('class', 'target-text meaning hidden');

    Link.update_text(path_elements);
  }
}

Link.addEvents({
  mouseover: function () {
    d3.select(this).selectAll('.meaning').classed('hidden', false);
  },
  mouseout: function () {
    d3.select(this).selectAll('.meaning').classed('hidden', true);
  }
});

class StorageHelper {
  // Helper object that makes it easy to update and save graph and view info

  constructor(variable) {
    this.val = variable;
    this.writing = false;

    this.nodes = variable.nodes;
    this.links = variable.links;
    this.scale = variable.scale;
    this.translate = variable.translate;
  }

  merge(obj) {
    this.writing = true;
    Object.entries(obj).forEach(
      (val) => this.update(val[0], val[1])
    );
    this.save();
  }

  update(property, value) {
    this.val[property] = value;
    this[property] = value;

    if (!this.writing) {
      this.save();
    }
  }

  save() {
    console.log('saving', this.val);
    d3.select('#graph-field').html(JSON.stringify(this.val));
    this.writing = false;
  }
}

class Viewport {
  static width = 960;
  static height = 500;
  static visibleGraph = null;

  constructor(storage) {
    this.storage = storage;
    this.scale = storage.scale || 1;
    this.translate = storage.translate || [0, 0];

    this.panel = null;
    this.translateContainer = null;
    this.scaleContainer = null;
    this.graphArea = null;
    this.width = Viewport.width;
    this.height = Viewport.height;

    this.setup();
  }

  setup() {
    this.panel = d3.select('#panel')
      .attr('oncontextmenu', 'return false;')
      .attr('width', Viewport.width)
      .attr('height', Viewport.height);
    this.translateContainer = this.panel.append('g');
    this.scaleContainer = this.translateContainer.append('g');
    this.graphArea = this.scaleContainer.append('g');

    var viewport = this;

    d3.select('#in')
      .on('click', function () {
        viewport.zoom(0.1);
      });
    d3.select('#out')
      .on('click', function () {
        viewport.zoom(-0.1);
      });
    d3.select('#up')
      .on('click', function () {
        viewport.pan(10, 0);
      });
    d3.select('#down')
      .on('click', function () {
        viewport.pan(-10, 0);
      });
    d3.select('#left')
      .on('click', function () {
        viewport.pan(0, 10);
      });
    d3.select('#right')
      .on('click', function () {
        viewport.pan(0, -10);
      });

    // draw
    this.draw();
  }

  draw() {
    this.translateContainer
      .attr('transform', 'translate(' + this.translate + ')');
    this.scaleContainer
      .attr('transform', 'scale(' + this.scale + ')');
  }

  save() {
    this.storage.merge({
      scale: this.scale,
      translate: this.translate
    });
  }

  zoom(newScale) {
    var oldscale = this.scale;
    this.scale += newScale;

    this.translate = [
      this.translate[0] + ((this.width * oldscale) - (this.width * this.scale)),
      this.translate[1] + ((this.height * oldscale) - (this.height * this.scale))
    ];

    this.draw();
    this.save();
  }

  pan(vert, horiz) {
    this.translate = [
      this.translate[0] + horiz,
      this.translate[1] + vert
    ];

    this.draw();
    this.save();
  }
}

class GraphView {
  static repaint_delay = 0;

  constructor(graph, viewport = null) {
    this.graph = graph;
    this.viewport = viewport;
    this.d3Graph = null;
    this.edge_group = null;
    this.node_group = null;
    this.drag_line = null;

    this.full_repaint = false;
    this.repaint_soon = null;

    this.simUpdate = this.simUpdate.bind(this);

    if (this.viewport != null) {
      this.createView()
    }
  }

  trigger_repaint_style() {
    if (this.repaint_soon === null) {
      this.repaint_soon = setTimeout(this.repaint.bind(this), GraphView.epaint_delay);
    }
  }

  trigger_full_repaint() {
    // called when we add or remove elements
    this.full_repaint = true;
    this.trigger_repaint_style();
  }

  setViewport(viewport) {
    this.viewport = viewport;
    this.createView();
  }

  createView() {
    console.log(`GraphView.createView()`);
    if (this.viewport === null) {
      console.log(`GraphView Tried to call createView without a viewport set!`);
      return;
    }
    let vp = this.viewport

    this.d3Graph = d3.layout.force()
      .nodes(this.graph.nodes)
      .links(this.graph.edges)
      .size([vp.width / vp.scale, vp.height / vp.scale])
      .linkDistance(function (d) { return Math.log(3 / d.strength * 10) * 50; })
      .charge(-500)
      .on('tick', this.simUpdate);

    this.edge_group = vp.graphArea.append('g').selectAll('.link');
    this.node_group = vp.graphArea.append('g').selectAll('.node');
    this.drag_line = vp.graphArea.append('line').attr('class', 'link dragline hidden');
  }

  dragLineStart(node) {
    this.drag_line
      .classed('hidden', false)
      .attr({
        'x1': node.x,
        'y1': node.y,
        'x2': node.x,
        'y2': node.y
      });
  }

  dragLineHide() { this.drag_line.classed('hidden', true); }

  start() {
    if (this.view === null) {
      return;
    }
    console.log(`GraphView.start()`);
    this.trigger_full_repaint();
    this.repaint();

    return this;
  }

  simUpdate() {
    console.log(`GraphView.simUpdate()`);
    // console.log(`GraphView.graph = ${this.graph}`)
    Link.update_svg(this.edge_group);
    Node.update_svg(this.node_group);
  }

  repaint() {
    console.log(`GraphView.repaint()`);
    // console.log(`GraphView.graph = ${this.graph}`)
    if (this.full_repaint) {
      this.edge_group = this.edge_group.data(this.graph.edges);
      // NB: the function arg is crucial here! nodes are known by id, not by index!
      this.node_group = this.node_group.data(this.graph.nodes, function (d) { return d.id; });

      // paint any new nodes
      Link.create_svg(this.edge_group);
      Node.create_svg(this.node_group);

      // attach d3 events to nodes and links
      Link.attach_events(this.edge_group);
      Node.attach_events(this.node_group);
      if (typeof editMode === 'undefined')
        this.node_group.call(this.d3Graph.drag);

      // remove old elements
      this.edge_group.exit().remove();
      this.node_group.exit().remove();

      // (re)start the graph moving
      this.d3Graph.start();
    } else {
      // d3js is running a physics 'sim' on the nodes and edges, 
      // but we need to issue the draw commands
      Link.update_svg(this.edge_group);
      Node.update_svg(this.node_group);
    }

    // mini-repaint housekeeping
    this.full_repaint = false;
    // avoid double calls
    clearTimeout(this.repaint_soon);
    this.repaint_soon = null;
  }

}

class Graph {
  static node_props_to_ignore = ['x', 'y', 'px', 'py']
  static link_props_to_ignore = ['source', 'target']
  // static repaint_delay = 0;

  constructor(nodes = [], edges = []) {
    this.lastId = 0;
    this.nodes = nodes;
    this.edges = edges;
    this.view = null;
    this.storage = null;
    this.viewport = null;

    this._wrapLink = this._wrapLink.bind(this);
    this._wrapNode = this._wrapNode.bind(this);
    this._repaint_on_change = this._repaint_on_change.bind(this);
  }

  setStorage(storage) {
    this.storage = storage;
  }

  load(storage) {
    this.setStorage(storage);
    this.loadNodesFromJson(storage.nodes);
    this.loadLinksFromJson(storage.links);

    return this;
  }

  display(viewport = null) {
    if (viewport === null && this.viewport === null) {
      console.log(`Graph.display: no viewport available!`);
      return;
    }

    if (viewport != null) {
      // replace if needed
      this.viewport = viewport;
    }

    this.view = new GraphView(this, this.viewport);
    // we're the visible graph right now
    Viewport.visibleGraph = this;

    return this;
  }

  trigger_repaint_style() {
    if (this.view != null) {
      this.view.trigger_repaint_style();
    }
  }

  trigger_full_repaint() {
    if (this.view != null) {
      this.view.trigger_full_repaint();
    }
  }

  toString() { return `Graph[${this.nodes.map((n) => n.toString())}]`; }

  _repaint_on_change(object, props_to_ignore, repaint) {
    return new Proxy(object, {
      set: function (obj, prop, value) {
        if (!props_to_ignore.includes(prop)) {
          repaint();
        }
        if (typeof value === 'number' && isNaN(value)) {
          console.log(`set nan`);
        }
        obj[prop] = value;
        return true;
      },
      deleteProperty: function (o, k) {
        delete o[k];
        if (!props_to_ignore.includes(k)) {
          repaint();
        }
        return true;
      }
    });
  }

  _wrapNode(node) {
    if (this.lastId < node.id) {
      this.lastId = node.id;
    }
    return this._repaint_on_change(node, Graph.node_props_to_ignore, this.trigger_repaint_style.bind(this));
  }

  _wrapLink(link) {
    return this._repaint_on_change(link, Graph.link_props_to_ignore, this.trigger_repaint_style.bind(this));
  }

  save() {
    if (this.storage === null) {
      return;
    }

    this.storage.merge({
      nodes: this.nodes,
      links: this.edges
    })
  }

  // 'public' methods

  select(element) {
    this.deselect();
    element.select();
  }

  deselect() {
    this.nodes.forEach((n) => n.unselect());
    this.edges.forEach((e) => e.unselect());
  }

  createNode(point) {
    let node = this._wrapNode(new Node(++this.lastId, point));
    this.nodes.push(node);
    this.save();
    this.trigger_full_repaint();
    return node;
  }

  createLink(source, target) {
    let existing = Link.search_index(this.edges, source, target);

    if (existing) {
      // Don't create dupliacte links
      return existing;
    }

    let link = this._wrapLink(new Link(source, target))
    this.edges.push(link);
    this.save();
    this.trigger_full_repaint();
    return link;
  }

  removeLink(link) {
    let was_inserted = this.edges.indexOf(link);
    if (was_inserted >= 0) {
      this.edges.splice(was_inserted, 1);
    }
    this.save();
    this.trigger_full_repaint();
    return link;
  }

  removeNode(node) {
    let was_inserted = this.nodes.indexOf(node);
    if (was_inserted >= 0) {
      // remove from node list
      this.nodes.splice(was_inserted, 1);
      // remove all references from links
      this.edges
        .filter((l) => (l.source === node || l.target === node)).
        forEach((link) => this.removeLink(link));
    }
    // alaways decrement, even if the node wasn't inserted for some reason
    this.lastId--;
    this.save();
    this.trigger_full_repaint();
    return node;
  }

  // Node and Edge Creation
  loadNodesFromJson(nodeJsonObject) {
    this.nodes = nodeJsonObject.map(Node.from).map(this._wrapNode);
  }
  loadLinksFromJson(linkJsonObject) {
    // we're restaring from stored JSON
    this.edges = linkJsonObject.map(Link.from).map(this._wrapLink);
    this.edges.forEach((edge) => edge.refreshNodeObjects(this.nodes));
  }

  // Use proxy objects to trigger a draw call if needed
}

let storage = new StorageHelper(window.graph);
let viewport = new Viewport(storage);
let graphView = new Graph()
  .load(storage)
  .display(viewport)
  .view.start();


// set up SVG for D3
var mousedown_link = null,
  mousedown_node = null,
  mouseup_node = null,
  mouse_over_link = false,
  editing = false;

function panzoom() {
  d3.event.preventDefault()
  switch (d3.event.key) {
    case 'ArrowUp':
    case 'w':
    case 'k':
      viewport.pan(10, 0);
      break;
    case 'ArrowDown':
    case 's':
    case 'j':
      viewport.pan(-10, 0);
      break;
    case 'ArrowLeft':
    case 'a':
    case 'h':
      viewport.pan(0, 10);
      break;
    case 'ArrowRight':
    case 'd':
    case 'l':
      viewport.pan(0, -10);
      break;
    case '+':
      viewport.zoom(0.1);
      break;
    case '-':
      viewport.zoom(-0.1);
      break;
  }
}

d3.select(window)
  .on('keydown', panzoom);

console.log(`Calling base start`);
// app starts here
//startGraphAnimation();