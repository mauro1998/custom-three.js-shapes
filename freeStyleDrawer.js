/**
* @file freeStyleDrawer.js
* @description A three.js plugin class that allows drawing custom shape geometries
* in a freestyle way with the mouse pointer.
* @author Mauro Aguilar Bustamante <mauro.aguilar@lindencolombia.com>
* @copyright Linden Colombia, 2016.
*/

(function() {
  function FreeStyleDrawer(options) {
    var shapes = this.shapes = [];
    var camera = this.camera = options.camera;
    var scene = this.scene = options.scene;
    var domElement = options.domElement;
    var DEFAULT_MAX_POINTS = 500;
    var lineOptions = options.line;
    var lines = [];
    var width = options.width;
    var height = options.height;

    this.updateDimensions = function(w, h) {
      width = w;
      height = h;
    };

    this.init = function () {
      domElement.addEventListener('mousedown', onMouseDown, false);
    };

    this.keepDrawing = function() {
      var line = getCurrentLine();
      if (line) line.updateLinePositions();
    }

    function getClickCoordinates(e) {
      var x = (e.clientX / width) * 2 - 1;
      var y = - (e.clientY / height) * 2 + 1;
      var z = 0;
      return new THREE.Vector3(x, y, z);
    }

    function getCurrentLine() {
      var index = lines.length ? lines.length - 1 : 0;
      return lines[index];
    };

    function onMouseDown(e) {
      if (e.which === 3) return;
      startDrawing(lineOptions);
      domElement.addEventListener('mousemove', onMouseMove, false);
      domElement.addEventListener('mouseup', onMouseUp, false);
    }

    function onMouseMove(e) {
      var line = getCurrentLine();
      var vector = getClickCoordinates(e);
      vector.unproject(camera);
      line.points.push(vector);
    }

    function onMouseUp() {
      domElement.removeEventListener('mousemove', onMouseMove, false);
      var line = getCurrentLine();
      if (line.points.length > 2) {
        line.points.push(line.points[0].clone());
        var vertices = [];

        for (var i = 0; i < line.points.length; i++) {
          var vertex = line.points[i].clone();
          var direction = vertex.sub(camera.position).normalize();
          var distance = - camera.position.z / direction.z;
          vertices.push(camera.position.clone().add(direction.multiplyScalar(distance)));
        }

        drawShape(vertices);
      } else {
        scene.remove(line.mesh);
        line.geometry.dispose();
        line.material.dispose();
      }
    }

    function startDrawing(options) {
      if(!options.maxPoints) options.maxPoints = DEFAULT_MAX_POINTS;
      var line = new FreeStyleLine(options);
      lines.push(line);
      scene.add(line.mesh);
    }

    function drawShape(vertices) {
      var shape = new THREE.Shape(vertices);
      var geometry = new THREE.ShapeGeometry(shape);
      var material = new THREE.MeshBasicMaterial({ color: Math.random() * 0xFFFFFF });
      var mesh = new THREE.Mesh(geometry, material);
      shapes.push(mesh);
      scene.add(mesh);
    }
  };

  function FreeStyleLine(options) {
    this.points = [];
    this.geometry = new THREE.BufferGeometry();
    this.material = new THREE.LineBasicMaterial({
      color: options.color,
      linewidth: options.linewidth
    });
    this.positions = new Float32Array(options.maxPoints * 3);
    this.geometry.addAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.drawCount = 2;
    this.geometry.setDrawRange(0, this.drawCount);
    this.mesh = new THREE.Line(this.geometry, this.material);

    this.updateLinePositions = function() {
      this.drawCount = this.points.length;
      this.geometry.setDrawRange(0, this.drawCount);
      var positions = this.geometry.attributes.position.array;

      for (var i = 0, j = 0; i < this.points.length; i++) {
        positions[j++] = this.points[i].x;
        positions[j++] = this.points[i].y;
        positions[j++] = this.points[i].z;
      }

      this.geometry.attributes.position.needsUpdate = true;
    };
  }

  THREE.FreeStyleDrawer = FreeStyleDrawer;
})();
