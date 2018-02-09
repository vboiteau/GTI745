package mcguffin.android.simplewireframesketcher;

// This class is for storing axis-aligned boxes.
public class AlignedBox3D {

	private boolean isEmpty = true;

	// diagonally opposite corners
	private Point3D p0 = new Point3D(0,0,0);
	private Point3D p1 = new Point3D(0,0,0);

	public AlignedBox3D() {
	}
	public AlignedBox3D( Point3D min, Point3D max ) {
		assert min.x() <= max.x() : "bounds error";
		assert min.y() <= max.y() : "bounds error";
		assert min.z() <= max.z() : "bounds error";
		p0.copy( min );
		p1.copy( max );
		isEmpty = false;
	}

	public boolean isEmpty() { return isEmpty; }
	public void clear() { isEmpty = true; }

	public Point3D getMin() { return p0; }
	public Point3D getMax() { return p1; }
	public Vector3D getDiagonal() { return Point3D.diff(p1,p0); }
	public Point3D getCenter() {
		return Point3D.average( p0, p1 );
	}

	// Enlarge the box as necessary to contain the given point
	public void bound( Point3D p ) {
		if ( isEmpty ) {
			p0.copy(p);
			p1.copy(p);
			isEmpty = false;
		}
		else {
			if ( p.x() < p0.x() )
				p0.p[0] = p.x();
			else if ( p.x() > p1.x() )
				p1.p[0] = p.x();

			if ( p.y() < p0.y() )
				p0.p[1] = p.y();
			else if ( p.y() > p1.y() )
				p1.p[1] = p.y();

			if ( p.z() < p0.z() )
				p0.p[2] = p.z();
			else if ( p.z() > p1.z() )
				p1.p[2] = p.z();
		}
	}

	// Enlarge the box as necessary to contain the given box
	public void bound( AlignedBox3D box ) {
		bound( box.p0 );
		bound( box.p1 );
	}

	public boolean contains( Point3D p ) {
		return !isEmpty
			&& p0.x() <= p.x() && p.x() <= p1.x()
			&& p0.y() <= p.y() && p.y() <= p1.y()
			&& p0.z() <= p.z() && p.z() <= p1.z();
	}

	public Point3D getCorner(int i) {
		return new Point3D(
			((i & 1)!=0) ? p1.x() : p0.x(),
			((i & 2)!=0) ? p1.y() : p0.y(),
			((i & 4)!=0) ? p1.z() : p0.z()
		);
	}

	// Return the corner that is furthest along the given direction.
	public Point3D getExtremeCorner( Vector3D v ) {
		return new Point3D(
			v.x() > 0 ? p1.x() : p0.x(),
			v.y() > 0 ? p1.y() : p0.y(),
			v.z() > 0 ? p1.z() : p0.z()
		);
	}

	// Return the index of the corner that
	// is furthest along the given direction.
	public int getIndexOfExtremeCorner( Vector3D v ) {
		int returnValue = 0;
		if (v.x() > 0) returnValue |= 1;
		if (v.y() > 0) returnValue |= 2;
		if (v.z() > 0) returnValue |= 4;
		return returnValue;
	}

	public boolean intersects(
		Ray3D ray, // input
		Point3D intersection, // output
		Vector3D normalAtIntersection // output
	) {
		// We compute a bounding sphere for the box.
		// If the ray intersects the bounding sphere,
		// it *may* intersect the box.
		// If the ray does NOT intersect the bounding sphere,
		// then it cannot intersect the box.
		if ( ! new Sphere( getCenter(), Point3D.diff(p1,p0).length() / 2 ).intersects(
			ray, intersection, true
		) ) {
			return false;
		}

		boolean intersectionDetected = false;
		float distance = 0;

		// candidate intersection
		float candidateDistance;
		Point3D candidatePoint;

		if ( ray.direction.x() != 0 ) {
			candidateDistance = -(ray.origin.x() - p0.x())/ray.direction.x();
			if (
				candidateDistance>=0
				&& (!intersectionDetected || candidateDistance<distance)
			) {
				candidatePoint = ray.point( candidateDistance );
				if (p0.y()<=candidatePoint.y() && candidatePoint.y()<=p1.y()
					&& p0.z()<=candidatePoint.z() && candidatePoint.z()<=p1.z() ) {
					distance = candidateDistance;
					intersection.copy( candidatePoint );
					normalAtIntersection.copy( new Vector3D( -1, 0, 0 ) );
					intersectionDetected = true;
				}
			}
			candidateDistance = -(ray.origin.x() - p1.x())/ray.direction.x();
			if (
				candidateDistance>=0
				&& (!intersectionDetected || candidateDistance<distance)
			) {
				candidatePoint = ray.point( candidateDistance );
				if (p0.y()<=candidatePoint.y() && candidatePoint.y()<=p1.y()
					&& p0.z()<=candidatePoint.z() && candidatePoint.z()<=p1.z() ) {
					distance = candidateDistance;
					intersection.copy( candidatePoint );
					normalAtIntersection.copy( new Vector3D( 1, 0, 0 ) );
					intersectionDetected = true;
				}
			}
		}
		if ( ray.direction.y() != 0 ) {
			candidateDistance = -(ray.origin.y() - p0.y())/ray.direction.y();
			if (
				candidateDistance>=0
				&& (!intersectionDetected || candidateDistance<distance)
			) {
				candidatePoint = ray.point( candidateDistance );
				if (p0.x()<=candidatePoint.x() && candidatePoint.x()<=p1.x()
					&& p0.z()<=candidatePoint.z() && candidatePoint.z()<=p1.z() ) {
					distance = candidateDistance;
					intersection.copy( candidatePoint );
					normalAtIntersection.copy( new Vector3D( 0, -1, 0 ) );
					intersectionDetected = true;
				}
			}
			candidateDistance = -(ray.origin.y() - p1.y())/ray.direction.y();
			if (
				candidateDistance>=0
				&& (!intersectionDetected || candidateDistance<distance)
			) {
				candidatePoint = ray.point( candidateDistance );
				if (p0.x()<=candidatePoint.x() && candidatePoint.x()<=p1.x()
					&& p0.z()<=candidatePoint.z() && candidatePoint.z()<=p1.z() ) {
					distance = candidateDistance;
					intersection.copy( candidatePoint );
					normalAtIntersection.copy( new Vector3D( 0, 1, 0 ) );
					intersectionDetected = true;
				}
			}
		}
		if ( ray.direction.z() != 0 ) {
			candidateDistance = -(ray.origin.z() - p0.z())/ray.direction.z();
			if (
				candidateDistance>=0
				&& (!intersectionDetected || candidateDistance<distance)
			) {
				candidatePoint = ray.point( candidateDistance );
				if (p0.y()<=candidatePoint.y() && candidatePoint.y()<=p1.y()
					&& p0.x()<=candidatePoint.x() && candidatePoint.x()<=p1.x() ) {
					distance = candidateDistance;
					intersection.copy( candidatePoint );
					normalAtIntersection.copy( new Vector3D( 0, 0, -1 ) );
					intersectionDetected = true;
				}
			}
			candidateDistance = -(ray.origin.z() - p1.z())/ray.direction.z();
			if (
				candidateDistance>=0
				&& (!intersectionDetected || candidateDistance<distance)
			) {
				candidatePoint = ray.point( candidateDistance );
				if (p0.y()<=candidatePoint.y() && candidatePoint.y()<=p1.y()
					&& p0.x()<=candidatePoint.x() && candidatePoint.x()<=p1.x() ) {
					distance = candidateDistance;
					intersection.copy( candidatePoint );
					normalAtIntersection.copy( new Vector3D( 0, 0, 1 ) );
					intersectionDetected = true;
				}
			}
		}
		return intersectionDetected;

	}

}
