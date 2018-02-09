package mcguffin.android.simplewireframesketcher;

public class Plane {
	Vector3D n = new Vector3D(); // the normal to the plane

	// The equation of the plane is ax+by+cz+d=0,
	// where (a,b,c) are the components of the normal ``n''
	float d = 0;

	public Plane() { d = 0; }
	public Plane( Vector3D normal, Point3D p ) {
		n.copy( normal.normalized() );
		d = - n.x()*p.x() - n.y()*p.y() - n.z()*p.z();
	}

	// Returns true if there is an intersection,
	// in which case the point of intersection is also returned
	public boolean intersects(
		Ray3D ray, // input
		Point3D intersection, // output
		boolean allowIntersectionEvenIfPlaneIsBackfacing
	) {
		float dot = Vector3D.dot( n, ray.direction );
		if ( !allowIntersectionEvenIfPlaneIsBackfacing && dot > 0 ) {
			return false;
		}
		if ( dot == 0 ) {
			return false;
		}

		// Reference: Foley et al., "Computer Graphics: Principles and Practice",
		// 2nd edition, 1990, page 1101
		Point3D pointOnPlane = new Point3D( Vector3D.mult( n , -d ) );
		float t = Vector3D.dot( Point3D.diff( pointOnPlane, ray.origin ), n ) / dot;

		if ( t < 0 ) {
			return false;
		}

		intersection.copy( ray.point( t ) );
		return true;
	}
}
