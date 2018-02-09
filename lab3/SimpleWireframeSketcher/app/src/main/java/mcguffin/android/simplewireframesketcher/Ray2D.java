package mcguffin.android.simplewireframesketcher;


public class Ray2D {

	public Point2D origin = new Point2D();
	public Vector2D direction = new Vector2D();

	public Ray2D( Point2D o, Vector2D d ) {
		origin.copy( o );
		direction.copy( d );
	}

	public Point2D point( float t ) {
		return Point2D.sum(origin,Vector2D.mult(direction,t));
	}

	public static boolean doRaysIntersect( Ray2D r1, Ray2D r2, Point2D intersection ) {

		// The rays are defined by the equations
		//    r1 = d1*t1 + o1
		//    r2 = d2*t2 + o2
		// where d1, d2 are direction vectors
		// and o1, o2 are origin points.
		// An intersection occurs where r1 = r2, hence
		//    d1*t1 + o1 = d2*t2 + o2
		// or
		//    d1*t1 - d2*t2 = o2 - o1
		// 
		// breaking the above equation down into x and y components,
		// 
		//    d1x*t1 - d2x*t2 = o2x - o1x
		//    d1y*t1 - d2y*t2 = o2y - o1y
		// 
		// Using Cramer's rule,
		// 
		//    denominator = d1x*d2y-d2x*d1y
		//    t1 = ((o2x-o1x)*d2y-d2x*(o2y-o1y))/denominator
		//    t2 = (d1x*(o2y-o1y)-(o2x-o1x)*d1y)/denominator

		float denominator = r1.direction.x() * r2.direction.y() - r2.direction.x() * r1.direction.y();
		if ( denominator != 0 ) {
			float t1 = ((r2.origin.x()-r1.origin.x())*r2.direction.y()-r2.direction.x()*(r2.origin.y()-r1.origin.y()))/denominator;
			intersection.copy( r1.point(t1) );
			return true;
		}
		return false;
	}

}

