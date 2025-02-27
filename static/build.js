'use strict';

// helpers
function createLink(source, target) { return Viewport.visibleGraph.createLink(source, target); }
function createNode(point) { return Viewport.visibleGraph.createNode(point); }
function removeLink(link) { return Viewport.visibleGraph.removeLink(link); }
function removeNode(node) { return Viewport.visibleGraph.removeNode(node); }


function resetMenus() {
  d3.select('#node-menu').style('display', 'none');
  d3.select('#link-menu').style('display', 'none');
}

function closeEditMenu() {
  editing = false;
  resetMenus();
}

function selectElement(target) {
  // Viewport.visibleGraph.trigger_repaint_style();
  if (target.selected()) {
    // de-select
    target.unselect();
    closeEditMenu();
  } else {
    editing = true;
    Viewport.visibleGraph.select(target);
    if (target instanceof Node) { // selecting a node
      editNode(target);
    } else {
      editLink(target);
    }
  }
}

function resetMouseVars() {
  mousedown_node = null;
}

// d3 events
Link.addEvents({
  mousedown: function (l) {
    if (d3.event.ctrlKey) {
      return;
    }

    // select link
    selectElement(l);
    resetMouseVars();
  }
});

Node.addEvents({
  mouseover: function (d) {
    // enlarge target node for link
    if (mousedown_node && d != mousedown_node) {
      d.setScale(1.1);
    }

  },
  mouseout: function (d) {
    if (mousedown_node && d != mousedown_node) {
      // unenlarge target node for link
      d.setScale(1);
    }
  },
  mousedown: function (d) {
    if (d3.event.ctrlKey) {
      return;
    }

    // save mousedown_node for later handling on mouseup and
    mousedown_node = d;

    // reset drag line to be centered on mousedown_node
    graphView.drag_line
      .classed('hidden', false)
      .attr({
        'x1': mousedown_node.x,
        'y1': mousedown_node.y,
        'x2': mousedown_node.x,
        'y2': mousedown_node.y
      });

  },
  mouseup: function (d) {
    if (!mousedown_node) {
      return;
    }

    // needed by FF
    graphView.drag_line
      .classed('hidden', true)
      .style('marker-end', '');

    // are we making a new link or clicking on a new node?
    if (d === mousedown_node) {
      // we clicked on a node to edit it
      selectElement(d);
    } else {
      // shrink down the node we just moused over
      d.setScale(1);
      // create and then select new link
      selectElement(createLink(mousedown_node, d));
    }

    resetMouseVars();
    // startGraphAnimation();
  }
});


function editNode(d) {
  // hide link menu
  d3.select('#link-menu').style('display', 'none');
  var nodeMenu = d3.select('#node-menu');
  nodeMenu.style('display', 'block');
  // We wish we could use arrow functions here but they don't have a semantic this
  nodeMenu.select('#edit-node-name')
    .property('value', d.name)
    .on('keyup', function () { d.name = this.value; });
  nodeMenu.select('#edit-node-fill')
    .property('value', d.fill)
    .on('keyup', function () { d.fill = this.value; });
  nodeMenu.select('#edit-node-r')
    .property('value', d.r)
    .on('input', function () { d.r = this.value; });
  nodeMenu.select('#edit-node-dashed')
    .property('checked', d.dashed)
    .on('change', function () { d.dashed = d3.select(this).property('checked') });
  nodeMenu.select('#delete-node')
    .on('click', function () {
      removeNode(d);
      closeEditMenu();
    });
}

function editLink(d) {
  d3.select('#node-menu').style('display', 'none');
  var linkMenu = d3.select('#link-menu');
  linkMenu.style('display', 'block');
  linkMenu.select('#link-name').text(d.name());
  linkMenu.select('#source-name').text(d.source.name);
  linkMenu.select('#target-name').text(d.target.name);
  linkMenu.select('#edit-center-text')
    .property('value', d.centerText)
    .on('keyup', function () { d.centerText = this.value; });
  linkMenu.select('#edit-source-text')
    .property('value', d.sourceText)
    .on('keyup', function () { d.sourceText = this.value; });
  linkMenu.select('#edit-source-arrow')
    .property('checked', d.sourceArrow)
    .on('change', function () { d.sourceArrow = d3.select(this).property('checked'); });
  linkMenu.select('#edit-target-text')
    .property('value', d.targetText)
    .on('keyup', function () { d.targetText = this.value; });
  linkMenu.select('#edit-target-arrow')
    .property('checked', d.targetArrow)
    .on('change', function () { d.targetArrow = d3.select(this).property('checked'); });
  linkMenu.select('#edit-strength')
    .property('value', d.strength)
    .on('input', function () { d.strength = this.value; });
  linkMenu.select('#edit-link-dashed')
    .property('checked', d.dashed)
    .on('change', function () { d.dashed = d3.select(this).property('checked'); });
  linkMenu.select('#delete-link')
    .on('click', function () {
      removeLink(d);
      closeEditMenu();
    });
}


function mousedown() {
  // prevent I-bar on drag
  //d3.event.preventDefault();

  // because :active only works in WebKit?
  viewport.graphArea.classed('active', true);

  if (d3.event.ctrlKey || d3.event.target.nodeName !== 'svg' || mouse_over_link) {
    return;
  }

  // insert new node at point
  var point = d3.mouse(this)
  selectElement(createNode(point));
}

function mousemove() {
  if (!mousedown_node) {
    return;
  }

  // update drag line
  var point = d3.mouse(this);
  graphView.drag_line
    .attr({
      'x1': mousedown_node.x,
      'y1': mousedown_node.y,
      'x2': point[0],
      'y2': point[1]
    });
}

function mouseup() {
  if (mousedown_node) {
    // hide drag line
    graphView.drag_line
      .classed('hidden', true)
      .style('marker-end', '');
  }
  if (editing) {
    return;
  }

  // because :active only works in WebKit?
  viewport.graphArea.classed('active', false);

  // clear mouse event vars
  resetMouseVars();
}

// only respond once per keydown
var lastKeyDown = -1;

function keydown() {
  if (lastKeyDown !== -1) {
    return;
  }
  lastKeyDown = d3.event.keyCode;

  // ctrl
  if (d3.event.keyCode === 17) {
    graphView.node_group.call(graphView.d3Graph.drag);
    viewport.graphArea.classed('ctrl', true);
  }
}

function keyup() {
  lastKeyDown = -1;

  // ctrl
  if (d3.event.keyCode === 17) {
    graphView.node_group
      .on('mousedown.drag', null)
      .on('touchstart.drag', null);
    viewport.graphArea.classed('ctrl', false);
  }
}


function submitSave()
{
  graphView.graph.deselect();
  graphView.graph.save();
}

function addTemplate(template) {
  var parts = template.split(';');
  var nodes = parts[0].split(',');
  var links = parts[1].split(',');
  var builtNodes = {};
  nodes.forEach(function (d) {
    builtNodes[d] = createNode(null);
  });
  links.forEach(function (d) {
    var linkParts = d.split('-');
    createLink(builtNodes[linkParts[0]], builtNodes[linkParts[1]]);
  })
}

viewport.panel.on('mousedown', mousedown)
  .on('mousemove', mousemove)
  .on('mouseup', mouseup);
d3.select(window)
  .on('keydown', keydown)
  .on('keyup', keyup);
d3.select('.expand-help').on('click', function (e) {
  d3.event.preventDefault();
  var body = d3.select('.instructions .body');
  body.classed('hidden', !body.classed('hidden'));
});

console.log(`Calling bottom of build`);
let editMode = true; // Listen, I'm stupid, and I don't know what I'm doing
graphView.node_group
  .on('mousedown.drag', null)
  .on('touchstart.drag', null);
// call again, which will disable dragging behavior
Viewport.visibleGraph.trigger_full_repaint();