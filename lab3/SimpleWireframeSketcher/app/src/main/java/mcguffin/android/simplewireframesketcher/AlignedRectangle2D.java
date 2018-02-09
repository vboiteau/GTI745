
package mcguffin.android.simplewireframesketcher;




public class AlignedRectangle2D {

	public boolean isEmpty = true;
	private Point2D min = new Point2D(0,0);
	private Point2D max = new Point2D(0,0);

	public AlignedRectangle2D() {
	}
	public AlignedRectangle2D( AlignedRectangle2D other ) {
		isEmpty = other.isEmpty;
		if ( ! isEmpty ) {
			min.copy( other.min );
			max.copy( other.max );
		}
	}
	public AlignedRectangle2D( Point2D p0, Point2D p1 ) {
		bound( p0 );
		bound( p1 );
	}

	public void clear() { isEmpty = true; }

	// Enlarge the rectangle as necessary to contain the given point
	public void bound( Point2D p ) {
		if ( isEmpty ) {
			min.copy(p);
			max.copy(p);
			isEmpty = false;
		}
		else {
			if ( p.x() < min.x() ) min.p[0] = p.x();
			else if ( p.x() > max.x() ) max.p[0] = p.x();

			if ( p.y() < min.y() ) min.p[1] = p.y();
			else if ( p.y() > max.y() ) max.p[1] = p.y();
		}
	}

	// Enlarge the rectangle as necessary to contain the given rectangle
	public void bound( AlignedRectangle2D rect ) {
		bound( rect.min );
		bound( rect.max );
	}

	public void translate( Vector2D v ) {
		min = Point2D.sum( min, v );
		max = Point2D.sum( max, v );
	}

	public boolean isEmpty() { return isEmpty; }

	public boolean contains( Point2D p ) {
		return !isEmpty
			&& min.x() <= p.x() && p.x() <= max.x()
			&& min.y() <= p.y() && p.y() <= max.y();
	}
	public boolean contains( AlignedRectangle2D r ) {
		if ( isEmpty ) return false;
		if ( r.isEmpty ) return true;
		return min.x() <= r.min.x() && r.max.x() <= max.x()
			&& min.y() <= r.min.y() && r.max.y() <= max.y();
	}

	public void intersect( AlignedRectangle2D r ) {
		if ( !isEmpty && ! r.isEmpty ) {
			if (
				r.min.x() < max.x() && r.min.y() < max.y()
				&& r.max.x() > min.x() && r.max.y() > min.y()
			) {
				if ( r.min.x() > min.x() ) min.p[0] = r.min.x();
				if ( r.min.y() > min.y() ) min.p[1] = r.min.y();

				if ( r.max.x() < max.x() ) max.p[0] = r.max.x();
				if ( r.max.y() < max.y() ) max.p[1] = r.max.y();

				return;
			}

		}

		// the intersection is empty
		isEmpty = true;
	}

	public Point2D getMin() { return min; }
	public Point2D getMax() { return max; }
	public Vector2D getDiagonal() { return Point2D.diff(max,min); }
	public Point2D getCenter() {
		return Point2D.average( min, max );
	}

	public float getWidth() {
		return Math.abs(max.x() - min.x());
	}
	public float getHeight() {
		return Math.abs(max.y() - min.y());
	}
	public boolean intersects(
		Ray2D ray, // input
		Point2D intersection // output
	) {
		boolean intersectionDetected = false;
		float distance = 0;

		// candidate intersection
		float candidateDistance;
		Point2D candidatePoint;

		if ( ray.direction.x() != 0 ) {
			candidateDistance = -(ray.origin.x() - min.x())/ray.direction.x();
			if (
				candidateDistance>=0
				&& (!intersectionDetected || candidateDistance<distance)
			) {
				candidatePoint = ray.point( candidateDistance );
				if (min.y()<=candidatePoint.y() && candidatePoint.y()<=max.y()) {
					distance = candidateDistance;
					intersection.copy( candidatePoint );
					intersectionDetected = true;
				}
			}
			candidateDistance = -(ray.origin.x() - max.x())/ray.direction.x();
			if (
				candidateDistance>=0
				&& (!intersectionDetected || candidateDistance<distance)
			) {
				candidatePoint = ray.point( candidateDistance );
				if (min.y()<=candidatePoint.y() && candidatePoint.y()<=max.y()) {
					distance = candidateDistance;
					intersection.copy( candidatePoint );
					intersectionDetected = true;
				}
			}
		}
		if ( ray.direction.y() != 0 ) {
			candidateDistance = -(ray.origin.y() - min.y())/ray.direction.y();
			if (
				candidateDistance>=0
				&& (!intersectionDetected || candidateDistance<distance)
			) {
				candidatePoint = ray.point( candidateDistance );
				if (min.x()<=candidatePoint.x() && candidatePoint.x()<=max.x()) {
					distance = candidateDistance;
					intersection.copy( candidatePoint );
					intersectionDetected = true;
				}
			}
			candidateDistance = -(ray.origin.y() - max.y())/ray.direction.y();
			if (
				candidateDistance>=0
				&& (!intersectionDetected || candidateDistance<distance)
			) {
				candidatePoint = ray.point( candidateDistance );
				if (min.x()<=candidatePoint.x() && candidatePoint.x()<=max.x()) {
					distance = candidateDistance;
					intersection.copy( candidatePoint );
					intersectionDetected = true;
				}
			}
		}
		return intersectionDetected;
	}
}

