// ============================================================

var usePerspective = true;
var cullBackfaces = true;
var drawWireframe = true;
var fillFrontfaces = true;
var	sortPolygons = true;
var flatShading = false;

var drawAxes = true;
var drawTarget = true;
var drawBoundingBox = false;

var keydown;


document.addEventListener('keydown', function(evt){
   var evt = evt || window.event;
   
   keydown = evt.keyCode


},false);


// ============================================================
// Vec3 objects are for storing 3D points and 3D vectors.
// To create a new instance, use the new keyword:
//    var vector_a = new Vec3();
//    var vector_b = new Vec3(x,y,z);
// These objects are mutable. After an instance has been created,
// its coordinates can be changed by writing directly to data members:
//    vector_a.x = 10;
//    vector_a.y = 2;
//    vector_a.z = -5;
// ============================================================
function Vec3(x=0,y=0,z=0) {
	this.x = x;
	this.y = y;
	this.z = z;
}
Vec3.prototype = {
	// Performs a deep copy.
	copy : function(other) {
		this.x = other.x; this.y = other.y; this.z = other.z;
	},

	// Returns the negation of the vector.
	negate : function() { return new Vec3(-this.x,-this.y,-this.z); },

	// Returns the Euclidean length (also called magnitude or L2-norm) of the vector.
	norm : function() { return Math.sqrt( this.x*this.x + this.y*this.y + this.z*this.z ); },

	// Returns the squared length.
	// This is useful when the caller needs to compare
	// the length of a vector to a pre-defined threshold,
	// or compare the lengths of two vectors:
	// in such cases, comparing the squared length is sufficient,
	// and saves a square root operation.
	normSquared : function() { return this.x*this.x + this.y*this.y + this.z*this.z; },

	// Returns a normalized vector of unit length.
	normalize : function() {
		var n = this.norm();
		if ( n > 0 ) {
			var k = 1.0/n;
			return new Vec3( k*this.x, k*this.y, k*this.z );
		}
		return new Vec3();
	},

	indexOfLargestComponent : function() {
		var X = Math.abs(this.x);
		var Y = Math.abs(this.y);
		var Z = Math.abs(this.z);
		if ( X > Y ) {
			if ( X > Z ) return 0;
			else return 2;
		}
		else {
			if ( Y > Z ) return 1;
			else return 2;
		}
	}
};

// A static method that returns the sum of two vectors.
Vec3.sum = function( v1, v2 ) {
	return new Vec3( v1.x+v2.x, v1.y+v2.y, v1.z+v2.z );
};
// A static method that returns the difference of two vectors.
Vec3.diff = function( v1, v2 ) {
	return new Vec3( v1.x-v2.x, v1.y-v2.y, v1.z-v2.z );
};
// A static method that returns the product of a vector with a scalar.
Vec3.mult = function( v, k ) {
	return new Vec3( k*v.x, k*v.y, k*v.z );
};
// A static method that returns the dot product of two vectors
Vec3.dot = function( v1, v2 ) {
	return v1.x*v2.x + v1.y*v2.y + v1.z*v2.z;
};
// A static method that returns the cross product of two vectors
Vec3.cross = function( v1, v2 ) {
	return new Vec3(
		v1.y*v2.z - v1.z*v2.y,
		v1.z*v2.x - v1.x*v2.z,
		v1.x*v2.y - v1.y*v2.x
	);
};
// A static method that returns the centroid of two vectors
Vec3.average = function( v1, v2 ) {
	return new Vec3( (v1.x+v2.x)*0.5, (v1.y+v2.y)*0.5, (v1.z+v2.z)*0.5 );
};

// ============================================================
// Ray3 objects are for storing 3D rays.
// To create a new instance, use the new keyword:
//    var ray = new Ray3();
// ============================================================

function Ray3( vec3_origin = null, vec3_direction = null ) {
	this.origin = new Vec3();
	this.direction = new Vec3();
	if ( vec3_origin !== null && vec3_direction !== null ) {
		this.origin.copy( vec3_origin );
		this.direction.copy( vec3_direction );
	}
}
Ray3.prototype = {
	point : function(t) { return Vec3.sum(this.origin, Vec3.mult(this.direction,t) ); }
};

// ============================================================
// Plane objects are for storing 3D planes.
// To create a new instance, use the new keyword:
//    var normalToThePlane = new Vec3(...);
//    var pointOnThePlane = new Vec3(...);
//    var p = new Plane( normalToThePlane, pointOnThePlane );
// ============================================================

function Plane( normalToThePlane, pointOnThePlane ) {
	this.normal = new Vec3();
	this.normal.copy( normalToThePlane.normalize() );

	// The equation of the plane is ax+by+cz+d=0,
	// where (a,b,c) are the components of the normal
	this.d = - Vec3.dot( this.normal, pointOnThePlane );
}
Plane.prototype = {
	// This tests for intersection between the given ray and the plane.
	// If there is no intersection, this returns null.
	// If there is an intersection, it returns the intersection point
	// (an instance of Vec3).
	intersects : function(
		ray,
		allowIntersectionEvenIfPlaneIsBackfacing // boolean
	) {
		var intersection = new Vec3();

		var dot = Vec3.dot( this.normal, ray.direction );
		if ( ! allowIntersectionEvenIfPlaneIsBackfacing && dot > 0 ) {
			return null;
		}
		if ( dot === 0 ) {
			return null;
		}

		// Reference: Foley et al., "Computer Graphics: Principles and Practice",
		// 2nd edition, 1990, page 1101
		var pointOnPlane = Vec3.mult( this.normal, - this.d );
		var t = Vec3.dot( Vec3.diff( pointOnPlane, ray.origin ), this.normal ) / dot;

		if ( t < 0 ) {
			return null;
		}

		return ray.point( t );
	}
};


// ============================================================
// Sphere objects are for storing 3D spheres.
// To create a new instance, use the new keyword:
//    var s = new Sphere(new Vec3(center_x,center_y,center_z),radius);
// ============================================================

function Sphere( center, radius ) {
	this.center = new Vec3();
	this.center.copy( center );
	this.radiusSquared = radius * radius;
}
Sphere.prototype = {
	// This tests for intersection between the given ray and the sphere.
	// If there is no intersection, this returns null.
	// If there is an intersection, it returns the intersection point
	// (an instance of Vec3).
	intersects : function(
		ray,
		allowIntersectionEvenIfRayOriginatesInsideSphere // boolean
	) {
		// Consider a line of the form Q+v*t, where t is real
		var Q = ray.origin;
		var v = ray.direction;

		// the sphere's center
		var P = this.center;

		// Reference: Foley et al., "Computer Graphics: Principles and Practice",
		// 2nd edition, 1990, page 1101
		var Q_minus_P = Vec3.diff( Q, P );
		var b = 2*Vec3.dot(v,Q_minus_P);
		var c = Q_minus_P.normSquared() - this.radiusSquared;

		// Consider the quadratic equation
		//   t^2 + b*t + c = 0
		// If there are real roots, then the line intersects the sphere.
		// If there are *positive* roots, then the *ray* intersects the sphere.
		var determinant = b*b - 4*c;
		if ( determinant >= 0 ) {
			// Reference: Press et al., "Numerical Recipes in C", 2nd edition, 1992, page 184
			var q = -0.5*( b+(b>0?1:-1)*Math.sqrt(determinant) );
			var t1 = q;
			var t2 = c/q;
			if ( t1 >= 0 && t2 >= 0 ) {
				return ray.point( t1 < t2 ? t1 : t2 );
			}
			else {
				// At least one of the intersection points has a negative t value.
				// This implies that either there's no intersection between the
				// ray and sphere, or the origin of the ray is inside the sphere.
				if ( allowIntersectionEvenIfRayOriginatesInsideSphere ) {
					if ( t1 >= 0 ) {
						return ray.point( t1 );
					}
					else if ( t2 >= 0 ) {
						return ray.point( t2 );
					}
				}
			}
		}
		return null;
	}
};


// ============================================================
// Box3 objects are for storing 3D axis-aligned boxes.
// To create a new instance, use the new keyword:
//    var box_a = new Box3();
//    var box_b = new Box3(new Vec3(-10,-10,-10),new Vec3(10,10,10));
// ============================================================

function Box3( vec3_min = null, vec3_max = null ) {
	// The min and max points are diagonally opposite, and are only used if isEmpty===false
	this.min = new Vec3();
	this.max = new Vec3();
	if ( vec3_min === null || vec3_max === null ) {
		this.isEmpty = true;
	}
	else {
		this.isEmpty = false;
		this.min.copy( vec3_min );
		this.max.copy( vec3_max );
	}
}
Box3.prototype = {
	center : function() { return Vec3.average(this.min,this.max); },
	diagonal : function() { return Vec3.diff(this.max,this.min); },
	corner : function(i) {
		return new Vec3(
			((i & 1)!==0) ? this.max.x : this.min.x,
			((i & 2)!==0) ? this.max.y : this.min.y,
			((i & 4)!==0) ? this.max.z : this.min.z
		);
	},

	// Gets the 4 enlarged corners related to the specific face.
	cornersOfFace : function( vect3 ){
		var v = [];
		for ( var i = 0; i < 8; i++ )
			v[i] = this.corner(i);

		if (vect3.x !== 0) {
			if (vect3.x > 0) {
				var addXN = new Vec3(0.2, -0.5, -0.5); 	// Bas droite
				var addXP = new Vec3(0.2, 0.5, 0.5);	// Haut Gauche
				var addYN = new Vec3(0.2, 0.5, -0.5); 	// Haut droite
				var addYP = new Vec3(0.2, -0.5, 0.5);	// Bas gauche

				return [Vec3.sum(v[1],addXN), Vec3.sum(v[3], addYN), Vec3.sum(v[7], addXP), Vec3.sum(v[5], addYP)];
			}
			else {
				var addXN = new Vec3(-0.2, -0.5, -0.5);	// Bas gauche
				var addXP = new Vec3(-0.2, 0.5, 0.5);	// Haut Gauche
				var addYN = new Vec3(-0.2, -0.5, 0.5);	// Bas droite
				var addYP = new Vec3(-0.2, 0.5, -0.5);	// Haut droite

				return [Vec3.sum(v[0],addXN), Vec3.sum(v[4], addYN), Vec3.sum(v[6], addXP), Vec3.sum(v[2], addYP)];
			}
		}
		else if (vect3.y !== 0) {
			if (vect3.y > 0) {
				var addXN = new Vec3(-0.5, 0.2, -0.5);	// Haut gauche
				var addXP = new Vec3(0.5, 0.2, 0.5);	// Bas droite
				var addYN = new Vec3(-0.5, 0.2, 0.5);	// Bas Gauche
				var addYP = new Vec3(0.5, 0.2, -0.5);	// Haut droite

				return [Vec3.sum(v[2],addXN), Vec3.sum(v[6], addYN), Vec3.sum(v[7], addXP), Vec3.sum(v[3], addYP)];
			}
			else {
				var addXN = new Vec3(-0.5, -0.2, -0.5);	// Bas gauche
				var addXP = new Vec3(0.5, -0.2, 0.5);	// Haut droite
				var addYN = new Vec3(0.5, -0.2, -0.5);	// Bas Droite
				var addYP = new Vec3(-0.5, -0.2, 0.5); 	// Haut gauche

				return [Vec3.sum(v[0],addXN), Vec3.sum(v[1], addYN), Vec3.sum(v[5], addXP), Vec3.sum(v[4], addYP)];
			}
		}
		else {
			if (vect3.z > 0) {
				var addXN = new Vec3(-0.5, -0.5, 0.2);
				var addXP = new Vec3(0.5, -0.5, 0.2);
				var addYN = new Vec3(0.5, 0.5, 0.2);	// Haut Gauche
				var addYP = new Vec3(-0.5, 0.5, 0.2); 	// Haut Droite

				return [Vec3.sum(v[4],addXN), Vec3.sum(v[5], addXP), Vec3.sum(v[7], addYN), Vec3.sum(v[6], addYP)];
			}
			else {
				var addXN = new Vec3(-0.5, -0.5, -0.2);	// Bas Droite
				var addXP = new Vec3(0.5, 0.5, -0.2);	// Haut gauche
				var addYN = new Vec3(-0.5, 0.5, -0.2);	// Haut droite
				var addYP = new Vec3(0.5, -0.5, -0.2);	// BAS gauche

				return [Vec3.sum(v[0],addXN), Vec3.sum(v[2], addYN), Vec3.sum(v[3], addXP), Vec3.sum(v[1], addYP)];
			}
		}
	},

	// Enlarges the box enough to contain the given point
	boundPoint : function( vec3 ) {
		if ( this.isEmpty ) {
			this.isEmpty = false;
			this.min.copy( vec3 );
			this.max.copy( vec3 );
		}
		else {
			if ( vec3.x < this.min.x ) this.min.x = vec3.x;
			else if ( vec3.x > this.max.x ) this.max.x = vec3.x;

			if ( vec3.y < this.min.y ) this.min.y = vec3.y;
			else if ( vec3.y > this.max.y ) this.max.y = vec3.y;

			if ( vec3.z < this.min.z ) this.min.z = vec3.z;
			else if ( vec3.z > this.max.z ) this.max.z = vec3.z;
		}
	},
	// Enlarges the box enough to contain the given box
	boundBox : function( box ) {
		this.boundPoint( box.min );
		this.boundPoint( box.max );
	},
	reset : function() {
		this.min = new Vec3();
		this.max = new Vec3();
	},
	// This tests for intersection between the given ray and the box.
	// If there is no intersection, it returns null.
	// If there is an intersection, it returns
	// an object of the form {intersection,normalAtIntersection}
	// where intersection and normalAtIntersection are instances of Vec3
	intersects : function( ray ) {
		// We compute a bounding sphere for the box.
		// If the ray intersects the bounding sphere,
		// it *may* intersect the box.
		// If the ray does NOT intersect the bounding sphere,
		// then it cannot intersect the box.
		if ( new Sphere( this.center(), this.diagonal().norm() / 2 ).intersects(
			ray, true
		) === null ) {
			return null;
		}

		var intersection = new Vec3();
		var normalAtIntersection = new Vec3();

		var intersectionDetected = false;
		var distance = 0.0;

		// candidate intersection
		var candidateDistance = 0.0;
		var candidatePoint = new Vec3();

		if ( ray.direction.x !== 0 ) {
			candidateDistance = -(ray.origin.x - this.min.x)/ray.direction.x;
			if (
				candidateDistance>=0
				&& (!intersectionDetected || candidateDistance<distance)
			) {
				candidatePoint = ray.point( candidateDistance );
				if (this.min.y<=candidatePoint.y && candidatePoint.y<=this.max.y
					&& this.min.z<=candidatePoint.z && candidatePoint.z<=this.max.z ) {
					distance = candidateDistance;
					intersection.copy( candidatePoint );
					normalAtIntersection = new Vec3( -1, 0, 0 );
					intersectionDetected = true;
				}
			}
			candidateDistance = -(ray.origin.x - this.max.x)/ray.direction.x;
			if (
				candidateDistance>=0
				&& (!intersectionDetected || candidateDistance<distance)
			) {
				candidatePoint = ray.point( candidateDistance );
				if (this.min.y<=candidatePoint.y && candidatePoint.y<=this.max.y
					&& this.min.z<=candidatePoint.z && candidatePoint.z<=this.max.z ) {
					distance = candidateDistance;
					intersection.copy( candidatePoint );
					normalAtIntersection = new Vec3( 1, 0, 0 );
					intersectionDetected = true;
				}
			}
		}
		if ( ray.direction.y !== 0 ) {
			candidateDistance = -(ray.origin.y - this.min.y)/ray.direction.y;
			if (
				candidateDistance>=0
				&& (!intersectionDetected || candidateDistance<distance)
			) {
				candidatePoint = ray.point( candidateDistance );
				if (this.min.x<=candidatePoint.x && candidatePoint.x<=this.max.x
					&& this.min.z<=candidatePoint.z && candidatePoint.z<=this.max.z ) {
					distance = candidateDistance;
					intersection.copy( candidatePoint );
					normalAtIntersection = new Vec3( 0, -1, 0 );
					intersectionDetected = true;
				}
			}
			candidateDistance = -(ray.origin.y - this.max.y)/ray.direction.y;
			if (
				candidateDistance>=0
				&& (!intersectionDetected || candidateDistance<distance)
			) {
				candidatePoint = ray.point( candidateDistance );
				if (this.min.x<=candidatePoint.x && candidatePoint.x<=this.max.x
					&& this.min.z<=candidatePoint.z && candidatePoint.z<=this.max.z ) {
					distance = candidateDistance;
					intersection.copy( candidatePoint );
					normalAtIntersection = new Vec3( 0, 1, 0 );
					intersectionDetected = true;
				}
			}
		}
		if ( ray.direction.z !== 0 ) {
			candidateDistance = -(ray.origin.z - this.min.z)/ray.direction.z;
			if (
				candidateDistance>=0
				&& (!intersectionDetected || candidateDistance<distance)
			) {
				candidatePoint = ray.point( candidateDistance );
				if (this.min.y<=candidatePoint.y && candidatePoint.y<=this.max.y
					&& this.min.x<=candidatePoint.x && candidatePoint.x<=this.max.x ) {
					distance = candidateDistance;
					intersection.copy( candidatePoint );
					normalAtIntersection = new Vec3( 0, 0, -1 );
					intersectionDetected = true;
				}
			}
			candidateDistance = -(ray.origin.z - this.max.z)/ray.direction.z;
			if (
				candidateDistance>=0
				&& (!intersectionDetected || candidateDistance<distance)
			) {
				candidatePoint = ray.point( candidateDistance );
				if (this.min.y<=candidatePoint.y && candidatePoint.y<=this.max.y
					&& this.min.x<=candidatePoint.x && candidatePoint.x<=this.max.x ) {
					distance = candidateDistance;
					intersection.copy( candidatePoint );
					normalAtIntersection = new Vec3( 0, 0, 1 );
					intersectionDetected = true;
				}
			}
		}
		return intersectionDetected
			? {intersection:intersection,normalAtIntersection:normalAtIntersection} : null;
	}
};


// ============================================================
// Mat4 objects are for storing 4x4 transformation matrices.
// To create a new instance, use the new keyword:
//    var matrix4x4_a = new Mat4();
// Internally, the matrix is stored as a 16-element array M in column-major form,
// where M[0], M[4], M[8], M[12] is the first row of the matrix,
// and M[0], M[1], M[2], M[3] is the first column.
// ============================================================

function Mat4() {
	this.M = [];
}
Mat4.prototype = {
	// Performs a deep copy of the given matrix.
	copy : function( other ) {
		this.M = other.M.slice(); // creates a deep copy of the array
	},

	// returns the product of the matrix with the given 3D vector
	multVec3 : function( v ) {
		return new Vec3(
			// We treat the vector as if
			// its (homogeneous) 4th component is zero.
			this.M[ 0]*v.x + this.M[ 4]*v.y + this.M[ 8]*v.z,
			this.M[ 1]*v.x + this.M[ 5]*v.y + this.M[ 9]*v.z,
			this.M[ 2]*v.x + this.M[ 6]*v.y + this.M[10]*v.z
		);
	}
};

// A static method that returns the product of two 4x4 matrices a and b
Mat4.mult = function( a, b ) {
	var m = new Mat4();
	m.M = [
		a.M[ 0]*b.M[ 0] + a.M[ 4]*b.M[ 1] + a.M[ 8]*b.M[ 2] + a.M[12]*b.M[ 3],
		a.M[ 1]*b.M[ 0] + a.M[ 5]*b.M[ 1] + a.M[ 9]*b.M[ 2] + a.M[13]*b.M[ 3],
		a.M[ 2]*b.M[ 0] + a.M[ 6]*b.M[ 1] + a.M[10]*b.M[ 2] + a.M[14]*b.M[ 3],
		a.M[ 3]*b.M[ 0] + a.M[ 7]*b.M[ 1] + a.M[11]*b.M[ 2] + a.M[15]*b.M[ 3],

		a.M[ 0]*b.M[ 4] + a.M[ 4]*b.M[ 5] + a.M[ 8]*b.M[ 6] + a.M[12]*b.M[ 7],
		a.M[ 1]*b.M[ 4] + a.M[ 5]*b.M[ 5] + a.M[ 9]*b.M[ 6] + a.M[13]*b.M[ 7],
		a.M[ 2]*b.M[ 4] + a.M[ 6]*b.M[ 5] + a.M[10]*b.M[ 6] + a.M[14]*b.M[ 7],
		a.M[ 3]*b.M[ 4] + a.M[ 7]*b.M[ 5] + a.M[11]*b.M[ 6] + a.M[15]*b.M[ 7],

		a.M[ 0]*b.M[ 8] + a.M[ 4]*b.M[ 9] + a.M[ 8]*b.M[10] + a.M[12]*b.M[11],
		a.M[ 1]*b.M[ 8] + a.M[ 5]*b.M[ 9] + a.M[ 9]*b.M[10] + a.M[13]*b.M[11],
		a.M[ 2]*b.M[ 8] + a.M[ 6]*b.M[ 9] + a.M[10]*b.M[10] + a.M[14]*b.M[11],
		a.M[ 3]*b.M[ 8] + a.M[ 7]*b.M[ 9] + a.M[11]*b.M[10] + a.M[15]*b.M[11],

		a.M[ 0]*b.M[12] + a.M[ 4]*b.M[13] + a.M[ 8]*b.M[14] + a.M[12]*b.M[15],
		a.M[ 1]*b.M[12] + a.M[ 5]*b.M[13] + a.M[ 9]*b.M[14] + a.M[13]*b.M[15],
		a.M[ 2]*b.M[12] + a.M[ 6]*b.M[13] + a.M[10]*b.M[14] + a.M[14]*b.M[15],
		a.M[ 3]*b.M[12] + a.M[ 7]*b.M[13] + a.M[11]*b.M[14] + a.M[15]*b.M[15]
	];
	return m;
};

// A static method that returns the identity matrix
Mat4.identity = function() {
	var m = new Mat4();
	m.M = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1
	];
	return m;
};

// A static method that returns a uniform scale matrix
Mat4.uniformScale = function(s) {
	var m = new Mat4();
	m.M = [
		s, 0, 0, 0,
		0, s, 0, 0,
		0, 0, s, 0,
		0, 0, 0, 1
	];
	return m;
};

// A static method that returns a translation matrix
// computed from the given 3D translation vector
Mat4.translation = function( v ) {
	var m = new Mat4();
	m.M[ 0] = 1; m.M[ 4] = 0; m.M[ 8] = 0; m.M[12] = v.x;
	m.M[ 1] = 0; m.M[ 5] = 1; m.M[ 9] = 0; m.M[13] = v.y;
	m.M[ 2] = 0; m.M[ 6] = 0; m.M[10] = 1; m.M[14] = v.z;
	m.M[ 3] = 0; m.M[ 7] = 0; m.M[11] = 0; m.M[15] = 1;
	return m;
};

// A static method that returns a rotation matrix
// computed from the given axis and angle
Mat4.rotationAroundOrigin = function( axis, angle_in_radians ) {
	var m = new Mat4();
	var c = Math.cos( angle_in_radians );
	var s = Math.sin( angle_in_radians );
	var one_minus_c = 1-c;
	m.M[ 0] = c + one_minus_c * axis.x*axis.x;
	m.M[ 5] = c + one_minus_c * axis.y*axis.y;
	m.M[10] = c + one_minus_c * axis.z*axis.z;
	m.M[ 1] = m.M[ 4] = one_minus_c * axis.x*axis.y;
	m.M[ 2] = m.M[ 8] = one_minus_c * axis.x*axis.z;
	m.M[ 6] = m.M[ 9] = one_minus_c * axis.y*axis.z;
	var xs = axis.x * s;
	var ys = axis.y * s;
	var zs = axis.z * s;
	m.M[ 1] += zs;  m.M[ 4] -= zs;
	m.M[ 2] -= ys;  m.M[ 8] += ys;
	m.M[ 6] += xs;  m.M[ 9] -= xs;

	m.M[12] = 0;
	m.M[13] = 0;
	m.M[14] = 0;
	m.M[ 3] = 0; m.M[ 7] = 0; m.M[11] = 0; m.M[15] = 1;
	return m;
};

// A static method that returns a rotation matrix
// computed from the given axis and angle
Mat4.rotationAroundPoint = function( axis, angle_in_radians, center ) {
	return Mat4.mult(
		Mat4.mult(
			Mat4.translation( center ),
			Mat4.rotationAroundOrigin( axis, angle_in_radians )
		),
		Mat4.translation( Vec3.negate( center ) )
	);
};

// ============================================================
// Cam3 objects are for storing 3D cameras.
// To create a new instance, use the new keyword:
//    var cam = new Cam3();
// We assume a right-handed coordinate system
// with x+ right, y+ up, z+ out of the screen, initially.
// ============================================================
function Cam3() {
	this.fieldOfViewInDegrees = 30; // fixed
	this.nearPlane = 1; // distance from camera to near plane, in world-space units; fixed
	this.ground = new Vec3(0,1,0); // this is normal to the ground plane and is fixed

	// During forward translation, if the camera gets too close
	// to the target point, we push the target point away.
	// The threshold distance at which this "pushing" of the
	// target point begins is this distance, in world space units.
	// It should, of course, be positive, and should not be bigger
	// than the smallest geometric feature that the user
	// might be interested in examining.
	this.pushThreshold = 1.0;

	// We initialize the below data members to non-zero values
	// because some initialization code somewhere might want to make use of them,
	// however these values will probably be overwritten with new values
	// soon after execution starts.
	this.viewportWidthInPixels = 10;
	this.viewportHeightInPixels = 10;
	this.viewportRadiusInPixels = 5;
	this.sceneCenter = new Vec3(0,0,0);
	this.sceneRadius = 10; // in world-space units
	this.position = new Vec3(0,0,10); // center of camera (or position of eye)
	this.target = new Vec3(0,0,0); // the camera looks toward this point
	this.up = new Vec3(0,1,0); // this is perpendicular to the direction that the camera is looking in
}

Cam3.prototype = {
	reset : function(box3_scene = null) {
		if(box3_scene !== null){
			this.sceneCenter = box3_scene.center();
			this.sceneRadius = 0.5 * box3_scene.diagonal().norm();
		}
		var tangent = Math.tan( this.fieldOfViewInDegrees/2 / 180 * Math.PI );
		// viewportRadiusInWorldSpaceUnits = this.nearPlane * tangent;
		var distanceFromTarget = this.sceneRadius / tangent;

		// initially: x+ right, y+ up, z+ backward
		this.position = new Vec3( this.sceneCenter.x, this.sceneCenter.y, this.sceneCenter.z+distanceFromTarget );

		this.target.copy( this.sceneCenter );
		this.up.copy( this.ground );
	},
	initialize : function(
		widthInPixels, heightInPixels, // dimensions of the viewport (the canvas)
		box3_scene // bounding box of the 3D scene
	) {
		this.viewportWidthInPixels = widthInPixels;
		this.viewportHeightInPixels = heightInPixels;
		this.viewportRadiusInPixels = widthInPixels < heightInPixels
			? 0.5*widthInPixels : 0.5*heightInPixels;
		this.sceneCenter = box3_scene.center();
		this.sceneRadius = 0.5 * box3_scene.diagonal().norm();

		this.reset();
	},
	// Causes the camera to "orbit" (rotate) around the target point.
	// This is also called "tumbling" in some software packages.
	orbit : function(
		delta_x_pixels, delta_y_pixels // mouse motion
	) {
		var orbitingSpeedInDegreesPerRadius = 300;
		var pixelsPerDegree = this.viewportRadiusInPixels
			/ orbitingSpeedInDegreesPerRadius;
		var radiansPerPixel = 1
			/ pixelsPerDegree * Math.PI / 180;
		// t2p is the vector from the target to the camera's position
		var t2p = Vec3.diff(this.position, this.target);

		var M = Mat4.rotationAroundOrigin(
			this.ground,
			(-delta_x_pixels) * radiansPerPixel
		);
		t2p = M.multVec3( t2p );
		this.up = M.multVec3( this.up );
		var right = Vec3.cross(this.up, t2p).normalize();
		M = Mat4.rotationAroundOrigin(
			right,
			(-delta_y_pixels) * radiansPerPixel
		);
		t2p = M.multVec3( t2p );
		this.up = M.multVec3( this.up );
		this.position = Vec3.sum(this.target, t2p);
	},
	// This causes the scene to appear to translate right and up
	// (what really happens is the camera is translated left and down).
	// This is also called "panning" in some software packages.
	// Passing in negative delta values causes the opposite motion.
	translateSceneRightAndUp : function(
		delta_x_pixels, delta_y_pixels
	) {
		// p2t is the vector from the camera's position to the target
		var p2t = Vec3.diff(this.target, this.position);
		var distanceFromTarget = p2t.norm();
		var forward = p2t.normalize();

		var translationSpeedInUnitsPerRadius =
			distanceFromTarget * Math.tan( this.fieldOfViewInDegrees/2 / 180 * Math.PI );
		var pixelsPerUnit = this.viewportRadiusInPixels
			/ translationSpeedInUnitsPerRadius;

		var right = Vec3.cross(forward, this.up);
		var translation = Vec3.sum(
			Vec3.mult( right, - delta_x_pixels / pixelsPerUnit ),
			Vec3.mult( this.up, - delta_y_pixels / pixelsPerUnit )
		);

		this.position = Vec3.sum(this.position, translation);
		this.target = Vec3.sum(this.target, translation);
	},
	// This causes the camera to translate forward into the scene.
	// This is also called "dollying" or "tracking" in some software packages.
	// Passing in a negative delta causes the opposite motion.
	translateCameraForward : function( delta_pixels ) {
		// p2t is the vector from the camera's position to the target
		var p2t = Vec3.diff(this.target, this.position);
		var distanceFromTarget = p2t.norm();
		var forward = p2t.normalize();

        var dollyDistance = (delta_pixels / 100) * (distanceFromTarget / 50);

        var new_distanceFromTarget = Math.max(this.pushThreshold,distanceFromTarget - dollyDistance);
        if (new_distanceFromTarget === this.pushThreshold) {
           return; 
        }

		this.nearPlane = new_distanceFromTarget / 30;

		this.position = Vec3.sum( this.position, Vec3.mult(forward,dollyDistance) );
        // this.target = Vec3.sum( this.position, Vec3.mult(forward,new_distanceFromTarget) );
        redraw();
	},
	// Computes the pixel covering the given point.
	// Returns an object of the form {x_pixels, y_pixels, depth}
	// where 'x_pixels', 'y_pixels' are the pixel coordinates and 'depth' is the
	// z-distance (in camera space) to the given point.
	// 'depth' is negative if the point is behind the camera.
	projectToPixel : function(
		vec3_p,
		usePerspectiveProjection // if false, we project orthographically
	) {
		// Transform the point from world space to camera space.

		var forward = Vec3.diff(this.target, this.position).normalize();
		var right = Vec3.cross(forward, this.up).normalize();

		var v = Vec3.diff(vec3_p, this.position);


		// Note that (right, up, forward) form an orthonormal basis.
		// To transform a point from camera space to world space,
		// we can use the 3x3 matrix formed by concatenating the
		// 3 vectors written as column vectors.  The inverse of such
		// a matrix is simply its transpose.  So here, to convert from
		// world space to camera space, we do
		var R = new Mat4(); // create rotation matrix
		R.M[ 0] = right.x;     R.M[ 4] = right.y;     R.M[ 8] = right.z;     R.M[12] = 0;
		R.M[ 1] = this.up.x;   R.M[ 5] = this.up.y;   R.M[ 9] = this.up.z;   R.M[13] = 0;
		R.M[ 2] = forward.x;   R.M[ 6] = forward.y;   R.M[10] = forward.z;   R.M[14] = 0;
		R.M[ 3] = 0;           R.M[ 7] = 0;           R.M[11] = 0;           R.M[15] = 1;
		var projected_v = R.multVec3(v); // transforming the point projects it to the camera plane
		var x = projected_v.x;
		var y = projected_v.y;
		var z = projected_v.z;

		// Here's an alternative way to do the same calculation.
		// Keep in mind that the projection of a vector A onto a unit vector B is the dot product of A and B.
		/*
		var x = Vec3.dot(v, right);
		var y = Vec3.dot(v, this.up);
		var z = Vec3.dot(v, forward);
		*/


		var k = usePerspectiveProjection ? ( this.nearPlane / z ) : 0.1/*this is arbitrary*/;

		var tangent = Math.tan( this.fieldOfViewInDegrees/2 / 180 * Math.PI );
		var viewportRadius = this.nearPlane * tangent;
		// Pixel coordinates of the viewport's center.
		// These will be half-integers if the viewport's dimensions are even.
		var viewportCenterX = (this.viewportWidthInPixels-1)*0.5;
		var viewportCenterY = (this.viewportHeightInPixels-1)*0.5;

		return {
			x_pixels : Math.round( k*this.viewportRadiusInPixels*x/viewportRadius + viewportCenterX ),
			y_pixels : Math.round( viewportCenterY - k*this.viewportRadiusInPixels*y/viewportRadius ),
			depth : z
		};
	},
	// Returns the ray through the center of the given pixel.
	computeRay : function(
		x_pixels, y_pixels
	) {
		var tangent = Math.tan( this.fieldOfViewInDegrees/2 / 180 * Math.PI );
		var viewportRadius = this.nearPlane * tangent;
		
		// Pixel coordinates of the viewport's center.
		// These will be half-integers if the viewport's dimensions are even.
		var viewportCenterX = (this.viewportWidthInPixels-1)*0.5;
		var viewportCenterY = (this.viewportHeightInPixels-1)*0.5;

		// This is a point on the near plane, in camera space
		var p = new Vec3(
			(x_pixels-viewportCenterX)*viewportRadius/this.viewportRadiusInPixels,
			(viewportCenterY-y_pixels)*viewportRadius/this.viewportRadiusInPixels,
			this.nearPlane
		);
		
		// Transform p to world space
		var forward = Vec3.diff(this.target, this.position).normalize();
		var right = Vec3.cross(forward, this.up).normalize();
		var v = Vec3.sum(Vec3.mult(right,p.x), Vec3.sum(Vec3.mult(this.up,p.y), Vec3.mult(forward,p.z)));

		return new Ray3( Vec3.sum(this.position, v), v.normalize() );
	}
};


// ============================================================
// Color objects are for storing colors with RGB and RGBA components.
// To create a new instance, use the new keyword:
//    var color1 = new Color(r,g,b); // r,g,b are between 0.0 and 1.0
//    var color2 = new Color(r,g,b,a); // a is also between 0.0 and 1.0
// ============================================================
function Color(r,g,b,a=1) {
	this.r = r;
	this.g = g;
	this.b = b;
	this.a = a;
}
Color.prototype = {
	// Returns the corresponding string
	toString : function() {
		var components = [ Math.floor(this.r*255), Math.floor(this.g*255), Math.floor(this.b*255) ];
		if ( this.a < 1 ) {
			components.push( this.a );
			return "rgba("+components.join()+")";
		}
		return "rgb("+components.join()+")";
	}
};
// A static method that returns the product of a color with a scalar.
Color.mult = function( v, k ) {
	return new Color( k*v.r, k*v.g, k*v.b, v.a );
};

// ============================================================

// This part of the code makes it possible to render polygons
// (and line segments, which are simply polygons with 2 points)



// The below variable is an array of polygons.
// Each polygon is an object of the form
//   {
//      // The below members are provided by a client
//      v,                      // array of Vec3 (points in world space)
//      isFill,fillColor,       // boolean and Color
//      isOutline,outlineColor, // boolean and Color
//
//      // The below members are computed from v
//      v_projected,            // array of objects {x_pixels, y_pixels, depth}
//      isFrontFace,            // boolean
//      depth                   // z distance in camera space to the vertex
//   }
// 
// If a polygon has only 2 points, it is rendered as a line segment
// in the outline color, and the fill color has no effect.
// If a polygon has 4 or more points, they are assumed to be coplanar.
// 
var polygonsToRender = [];

var clearPolygonsToRender = function() {
	polygonsToRender = [];
};

var pushPolygonToRender = function(
	v,                               // array of Vec3 (points in world space)
    isFill,fillColor,                // boolean and Color
    isOutline=false,outlineColor=""  // boolean and Color
) {
	var poly = {v:v,isFill:isFill,fillColor:fillColor,isOutline:isOutline,outlineColor:outlineColor};
	polygonsToRender.push(poly);
};
var pushLineSegmentToRender = function(
	v0,v1,
    outlineColor  // Color
) {
	pushPolygonToRender([v0,v1],false,"",true,outlineColor);
};
var pushTriToRender = function(
	v0,v1,v2,
    isFill,fillColor,                // boolean and Color
    isOutline=false,outlineColor=""  // boolean and Color
) {
	pushPolygonToRender([v0,v1,v2],isFill,fillColor,isOutline,outlineColor);
};
var pushQuadToRender = function(
	v0,v1,v2,v3,
    isFill,fillColor,                // boolean and Color
    isOutline=false,outlineColor=""  // boolean and Color
) {
	pushPolygonToRender([v0,v1,v2,v3],isFill,fillColor,isOutline,outlineColor);
};

var pushBoxToRender = function(
	box,                             // an instance of Box3
    isFill,fillColor,                // boolean and Color
    isOutline=false,outlineColor=""  // boolean and Color
) {
	var v = [];
	for ( var i = 0; i < 8; i++ )
		v[i] = box.corner(i);

	pushPolygonToRender([v[0],v[2],v[3],v[1]],isFill,fillColor,isOutline,outlineColor);
	pushPolygonToRender([v[4],v[5],v[7],v[6]],isFill,fillColor,isOutline,outlineColor);
	pushPolygonToRender([v[0],v[4],v[6],v[2]],isFill,fillColor,isOutline,outlineColor);
	pushPolygonToRender([v[1],v[3],v[7],v[5]],isFill,fillColor,isOutline,outlineColor);
	pushPolygonToRender([v[0],v[1],v[5],v[4]],isFill,fillColor,isOutline,outlineColor);
	pushPolygonToRender([v[2],v[6],v[7],v[3]],isFill,fillColor,isOutline,outlineColor);
};

var renderPolygons = function( camera, canvas, canvas_context ) {
	var i;
	var j;
	var poly;
	var p;
	// compute view-dependent information about the polygons
	for ( i=0; i < polygonsToRender.length; ++i ) {
		poly = polygonsToRender[i];
		poly.v_projected = [];
		poly.depth = 0;
		poly.isFrontFace = true;
		poly.isCulled = false;
		for ( j=0; j < poly.v.length; ++j ) {
			poly.v_projected[j] = camera.projectToPixel( poly.v[j], usePerspective );
			if ( poly.v_projected[j].depth < camera.nearPlane ) {
				// cancel this polygon
				poly.isCulled = true;
				break;
			}
			poly.depth += poly.v_projected[j].depth;
		}
		poly.depth /= poly.v.length;
		if ( ! poly.isCulled && poly.v.length >= 3 ) {
			var faceNormal = Vec3.cross(
				Vec3.diff( poly.v[1], poly.v[0] ),
				Vec3.diff( poly.v[2], poly.v[1] )
			).normalize();
			var dotProduct = Vec3.dot(
				Vec3.diff( poly.v[0], camera.position ).normalize(),
				faceNormal
			);
			poly.isFrontFace = ( dotProduct < 0 );
		}
	}

	// sort the faces by depth
	if ( sortPolygons )
		polygonsToRender.sort(function(a,b){return b.depth - a.depth;});

	// draw it

	canvas_context.clearRect(0, 0, canvas.width, canvas.height);

	for ( i=0; i < polygonsToRender.length; ++i ) {
		poly = polygonsToRender[i];



        if ( poly.isCulled || ( ! poly.isFrontFace && cullBackfaces ) ) {
            continue;
        }

		if ( poly.v.length >= 3 ) {
            var faceNormal = Vec3.cross(
                Vec3.diff( poly.v[1], poly.v[0] ),
                Vec3.diff( poly.v[2], poly.v[1] )
            ).normalize();

            var dotProduct = flatShading ?
                Vec3.dot(
                Vec3.diff( poly.v[0], camera.position ).normalize(),
                faceNormal
                ) :
                -1;

			if ( poly.isFill )
				canvas_context.fillStyle = Color.mult(poly.fillColor, (dotProduct * -1) * .75  + .25).toString();
			if ( poly.isOutline )
				canvas_context.strokeStyle = poly.outlineColor.toString();
			canvas_context.beginPath();
			p = poly.v_projected[0];
			canvas_context.moveTo( p.x_pixels, p.y_pixels );
			for ( j=1; j < poly.v.length; ++j ) {
				p = poly.v_projected[j];
				canvas_context.lineTo( p.x_pixels, p.y_pixels );
			}
			canvas_context.closePath();
			if ( poly.isFill )
				canvas_context.fill();
			if ( poly.isOutline )
				canvas_context.stroke();
		}
		else if ( poly.v.length === 2 ) {
			canvas_context.strokeStyle = poly.outlineColor.toString();
			canvas_context.beginPath();
			p = poly.v_projected[0];
			canvas_context.moveTo( p.x_pixels, p.y_pixels );
			p = poly.v_projected[1];
			canvas_context.lineTo( p.x_pixels, p.y_pixels );
			canvas_context.stroke();
		}
	}
};

// ============================================================

var boxes = [];
var boundingBoxOfScene = new Box3();

function initializeScene() {
	for ( var xi=0; xi<3; xi++ ) {
		for ( var zi=0; zi<3; zi++ ) {
			var x = 0.5+xi*1.5;
			var y = 0.5+(xi===1 ? 1.5 : 0) + (zi===1 ? 1.5 : 0);
			var z = 0.5+zi*1.5;
			boxes.push( new Box3( new Vec3(x,y,z), new Vec3(x+1,y+1,z+1) ) );
			if ( xi!==1 || zi!==1 ) {
				// create small cube
				x += 0.45;
				z += 0.45;
				y = 3.95;
				boxes.push( new Box3( new Vec3(x,y,z), new Vec3(x+0.1,y+0.1,z+0.1) ) );
			}
		}
	}
	/*
	for ( var i = 0; i < 10; i ++ ) {
		var x = Math.random() * 5 - 2.5;
		var y = Math.random() * 5 - 2.5;
		var z = Math.random() * 5 - 2.5;
		var dx = Math.random() * 0.5 + 1;
		var dy = Math.random() * 0.5 + 1;
		var dz = Math.random() * 0.5 + 1;
		boxes.push( new Box3( new Vec3(x,y,z), new Vec3(x+dx,y+dy,z+dz) ) );
	}
	*/
	
	for ( var i = 0; i < boxes.length; ++i ) {
		boundingBoxOfScene.boundBox( boxes[i] );
	}
}
initializeScene();

// This tests for intersection between the given ray and the boxes.
// If there is no intersection, it returns null.
// If there is an intersection, it returns
// an object of the form {index,intersection,normalAtIntersection}
// where index identifies which box is intersected
// and where intersection and normalAtIntersection are instances of Vec3
function findIntersectedBox( ray ) {
	var intersectionDetected = false;
	var indexOfIntersectedBox = -1;
	var distanceToIntersection = 0;
	var intersectionPoint = new Vec3();
	var normalAtIntersection = new Vec3();

	for ( var i = 0; i < boxes.length; ++i ) {
		var box = boxes[i];
		var candidate = box.intersects(ray);
		if ( candidate !== null ) {

			candidate.distance = Vec3.diff(
				ray.origin, candidate.intersection
			).norm();
			if (
				! intersectionDetected
				|| candidate.distance < distanceToIntersection
			) {
				// We've found a new, best candidate
				intersectionDetected = true;
				indexOfIntersectedBox = i;
				distanceToIntersection = candidate.distance;
				intersectionPoint.copy( candidate.intersection );
				normalAtIntersection.copy( candidate.normalAtIntersection );
			}
		}
	}
	if ( intersectionDetected )
		return { index:indexOfIntersectedBox, intersection:intersectionPoint, normalAtIntersection:normalAtIntersection };
	return null;
}

// ============================================================

var canvas = document.getElementById("myCanvas");
var canvas_context = canvas.getContext("2d");

var raycast_indexOfIntersectedBox = -1; // -1 means no intersection
var raycast_intersectionPoint = new Vec3();
var raycast_normalAtIntersection = new Vec3();
var raycast_box;
var showRect = false;


var camera = new Cam3();
camera.initialize( canvas.width, canvas.height, boundingBoxOfScene );

var color_fill = new Color(0,1,0);
var color_wireframe = new Color(0.5,0.5,0);
var color_cameraTarget = new Color(0,0.5,0.5);
var color_highlight = new Color(1,0,0);
var color_square = new Color(0,0,0, 0.2);

var worldSpaceOrigin = new Vec3(0,0,0);
var worldSpaceXAxisTip = new Vec3(1,0,0);
var worldSpaceYAxisTip = new Vec3(0,1,0);
var worldSpaceZAxisTip = new Vec3(0,0,1);
var worldSpaceXAxisColor = new Color(1,0,0);
var worldSpaceYAxisColor = new Color(0,0.7,0);
var worldSpaceZAxisColor = new Color(0,0,1);

var redraw = function() {
	var i;
	clearPolygonsToRender();

	boundingBoxOfScene.reset();
	for ( i = 0; i < boxes.length; ++i ) {
		boundingBoxOfScene.boundBox( boxes[i] );

		if ( i === raycast_indexOfIntersectedBox ) {
			pushBoxToRender( boxes[i], fillFrontfaces, color_fill, true, color_highlight );
        } else {
			pushBoxToRender( boxes[i], fillFrontfaces, color_fill, drawWireframe, color_wireframe );
        }
	}
	if ( drawBoundingBox ) {
		var color = new Color(0 ,1, 0, 0.5);
		pushBoxToRender(boundingBoxOfScene, fillFrontfaces, color, drawWireframe, color_wireframe);
	}
	
	if ( drawTarget ) {
		pushLineSegmentToRender( Vec3.sum(camera.target,new Vec3(-0.5,0,0)), Vec3.sum(camera.target,new Vec3(0.5,0,0)), color_cameraTarget );
		pushLineSegmentToRender( Vec3.sum(camera.target,new Vec3(0,-0.5,0)), Vec3.sum(camera.target,new Vec3(0,0.5,0)), color_cameraTarget );
		pushLineSegmentToRender( Vec3.sum(camera.target,new Vec3(0,0,-0.5)), Vec3.sum(camera.target,new Vec3(0,0,0.5)), color_cameraTarget );
	}

	if ( drawAxes ) {
		pushLineSegmentToRender( worldSpaceOrigin, worldSpaceXAxisTip, worldSpaceXAxisColor );
		pushLineSegmentToRender( worldSpaceOrigin, worldSpaceYAxisTip, worldSpaceYAxisColor );
		pushLineSegmentToRender( worldSpaceOrigin, worldSpaceZAxisTip, worldSpaceZAxisColor );
	}
	
	if ( raycast_indexOfIntersectedBox >= 0 ) {
		pushLineSegmentToRender( raycast_intersectionPoint, Vec3.sum(raycast_intersectionPoint,raycast_normalAtIntersection), color_highlight );

		if (showRect) {
			var corners = raycast_box.cornersOfFace(raycast_normalAtIntersection);

			pushPolygonToRender([corners[0], corners[1], corners[2], corners[3]], true, color_square, true, color_square);
		}
	}

	renderPolygons(camera, canvas, canvas_context);
};

redraw();


var old_mouse_x;
var old_mouse_y;

// for use with MouseEvent.button
const BUTTON_LEFT = 0;
const BUTTON_MIDDLE = 1;
const BUTTON_RIGHT = 2;
// for use with MouseEvent.buttons
const BUTTONS_BIT_LEFT = 1;
const BUTTONS_BIT_MIDDLE = 4;
const BUTTONS_BIT_RIGHT = 2;


function mouseDownHandler(e) {
	var canvas_rectangle = canvas.getBoundingClientRect();
	var mouse_x = e.clientX - canvas_rectangle.left;
	var mouse_y = e.clientY - canvas_rectangle.top;

	showRect = true;

	// perform raycast to find the intersected box
	var ray = camera.computeRay(mouse_x,mouse_y);
	var result = findIntersectedBox(ray);
	
	if ( result === null ) {
		raycast_indexOfIntersectedBox = -1;
	}
	else {
		raycast_box = new Box3(boxes[result.index].min, boxes[result.index].max);
		console.log(raycast_box);
	}

	redraw();
	old_mouse_x = mouse_x;
	old_mouse_y = mouse_y;
	//console.log("mouse down");
	//console.log("   " + mouse_x + "," + mouse_y);
}

function mouseUpHandler(e) {
	//var canvas_rectangle = canvas.getBoundingClientRect();
	//var mouse_x = e.clientX - canvas_rectangle.left;
	//var mouse_y = e.clientY - canvas_rectangle.top;
	//console.log("mouse up");
	showRect = false;
}

function mouseMoveHandler(e) {
	var canvas_rectangle = canvas.getBoundingClientRect();
	var mouse_x = e.clientX - canvas_rectangle.left;
	var mouse_y = e.clientY - canvas_rectangle.top;
	var delta_x = mouse_x - old_mouse_x;
	var delta_y = mouse_y - old_mouse_y;

	if ( e.ctrlKey ) {
		// move the camera
		if ( e.buttons === BUTTONS_BIT_LEFT ) {
			camera.orbit( delta_x, delta_y );
		}
		else if ( e.buttons === BUTTONS_BIT_RIGHT ) {
			camera.translateSceneRightAndUp( delta_x, - delta_y );
		}
		else if ( e.buttons === (BUTTONS_BIT_LEFT | BUTTONS_BIT_RIGHT) ) {
			camera.translateCameraForward( delta_x - delta_y );
		}
	}
	//Shift Click for resizing shape
	else if ( e.shiftKey ){

		if ( e.buttons === BUTTONS_BIT_LEFT ) {
			
			if ( raycast_indexOfIntersectedBox >= 0 ) {

				const MULTIPLIER = 10;

				var box = boxes[raycast_indexOfIntersectedBox];
				var norm = raycast_normalAtIntersection;

				var ray1 = camera.computeRay(old_mouse_x,old_mouse_y);
				var ray2 = camera.computeRay(mouse_x,mouse_y);

				var diff = Vec3.diff(ray2.origin, ray1.origin);



				if( norm.x != 0)
				{
					console.log("X")

					if ( norm.x === 1 ){
						console.log("Forward");

						box.max.x += diff.x*MULTIPLIER;

					}
					else{
						console.log("Backward");

						box.min.x += diff.x*MULTIPLIER;
					}

				}
				else if( norm.y != 0 ){

					console.log("Y")

					if ( norm.y === 1 ){

						console.log("Forward");

						box.max.y += diff.y*MULTIPLIER;
					}
					else{

						console.log("Backward");

						box.min.y += diff.y*MULTIPLIER;
					}

				}
				else if ( norm.z != 0 ){

					console.log("Z");

					if ( norm.z === 1 ){
						console.log("Forward");

						box.max.z += diff.z*MULTIPLIER;

					}
					else{
						console.log("Backward");

						box.min.z += diff.z*MULTIPLIER;
					}

				}


			}



		}
	}
	else if ( e.buttons === BUTTONS_BIT_LEFT ) {

		if ( raycast_indexOfIntersectedBox >= 0 ) {

			var ray1 = camera.computeRay(old_mouse_x,old_mouse_y);
			var ray2 = camera.computeRay(mouse_x,mouse_y);
			var plane = new Plane( raycast_normalAtIntersection, raycast_intersectionPoint );
			var intersection1 = plane.intersects(ray1);
			var intersection2 = plane.intersects(ray2);
			if ( intersection1!==null && intersection2!==null ) {
				var translationVector = Vec3.diff( intersection2, intersection1 );
				boxes[raycast_indexOfIntersectedBox].min = Vec3.sum( boxes[raycast_indexOfIntersectedBox].min, translationVector );
				boxes[raycast_indexOfIntersectedBox].max = Vec3.sum( boxes[raycast_indexOfIntersectedBox].max, translationVector );
			}
		}

	}
	else {
		// perform raycast to find the intersected box
		var ray = camera.computeRay(mouse_x,mouse_y);
		var result = findIntersectedBox(ray);
		if ( result === null ) {
			raycast_indexOfIntersectedBox = -1;
		}
		else {
			raycast_indexOfIntersectedBox = result.index;
			raycast_intersectionPoint.copy( result.intersection );
			raycast_normalAtIntersection.copy( result.normalAtIntersection );
		}

		showRect = false;
	}
	redraw();
	old_mouse_x = mouse_x;
	old_mouse_y = mouse_y;
}

canvas.addEventListener('mousedown',mouseDownHandler);
canvas.addEventListener('mouseup',mouseUpHandler);
canvas.addEventListener('mousemove',mouseMoveHandler);

canvas.onwheel = e => (
    e.ctrlKey ?
    camera.translateCameraForward(e.wheelDelta) :
    console.log('no ctrl')
);

canvas.oncontextmenu = function(e){ return false; }; // disable the right-click menu

document.getElementById('perspectiveProjection').addEventListener('click', e => {
    usePerspective = e.target.checked;
    redraw();
});

document.getElementById('cullBackFaces').addEventListener('click', e => {
    cullBackFaces = e.target.checked;
    redraw();
});

document.getElementById('drawWireframe').addEventListener('click', e => {
    drawWireframe = e.target.checked;
    redraw();
});

document.getElementById('fillFrontfaces').addEventListener('click', e => {
    fillFrontfaces = e.target.checked;
    redraw();
});

document.getElementById('color_fill').addEventListener('click', e => {
    color_fill = new Color(0 ,1, 0, e.target.checked?0.5:1.0);
    redraw();
});

document.getElementById('sortPolygons').addEventListener('click', e => {
    sortPolygons = e.target.checked;
    redraw();
});

document.getElementById('drawAxes').addEventListener('click', e => {
    drawAxes = e.target.checked;
    redraw();
});

document.getElementById('resetTarget').addEventListener('click', e => {
	camera.reset(boundingBoxOfScene);
    redraw();
});

document.getElementById('flatShading').addEventListener('click', e => {
    flatShading = e.target.checked;
    redraw();
});


document.getElementById('drawBoundingBox').addEventListener('click', e => {
	drawBoundingBox = e.target.checked;
	redraw();
});

document.getElementById('drawTarget').addEventListener('click', e => {
	drawTarget = e.target.checked;
	redraw();
});

document.getElementById('addBox').addEventListener('click', e => {
	//boxes.push( new Box3( new Vec3(0,0,0), new Vec3(1,1,1) ) );
	
	var vec_min = Vec3.sum(camera.target, new Vec3(-0.5, -0.5, -0.5) );
	var vec_max = Vec3.sum(camera.target, new Vec3(0.5, 0.5, 0.5) );

	boxes.push( new Box3(vec_min ,vec_max) );

	redraw();
});
