
package mcguffin.android.simplewireframesketcher;



public class Point2D {

	public float [] p = new float[2];

	public Point2D() {
		p[0] = p[1] = 0;
	}

	public Point2D( float x, float y ) {
		p[0] = x;
		p[1] = y;
	}

	public Point2D( Point2D P ) {
		p[0] = P.p[0];
		p[1] = P.p[1];
	}

	public Point2D( Vector2D V ) {
		p[0] = V.v[0];
		p[1] = V.v[1];
	}

	public void copy( float x, float y ) {
		p[0] = x;
		p[1] = y;
	}

	public void copy( Point2D P ) {
		p[0] = P.p[0];
		p[1] = P.p[1];
	}

	public void translate( Vector2D v ) {
		p[0] += v.x();
		p[1] += v.y();
	}

	public boolean equals( Point2D other ) {
		return x() == other.x() && y() == other.y();
	}

	public float x() { return p[0]; }
	public float y() { return p[1]; }

	// used to pass coordinates directly to OpenGL routines
	public float [] get() { return p; }

	// return the difference between two given points
	static public Vector2D diff( Point2D a, Point2D b ) {
		return new Vector2D( a.x()-b.x(), a.y()-b.y() );
	}

	// return the sum of the given point and vector
	static public Point2D sum( Point2D a, Vector2D b ) {
		return new Point2D( a.x()+b.x(), a.y()+b.y() );
	}

	// return the difference between the given point and vector
	static public Point2D diff( Point2D a, Vector2D b ) {
		return new Point2D( a.x()-b.x(), a.y()-b.y() );
	}

	public float distance( Point2D otherPoint ) {
		return diff( this, otherPoint ).length();
	}

	public static Point2D average( Point2D a, Point2D b ) {
		// return new Point2D( Vector2D.mult( Vector2D.sum( new Vector2D(a), new Vector2D(b) ), 0.5f ) );
		return new Point2D( (a.x()+b.x())*0.5f, (a.y()+b.y())*0.5f );
	}

	static public float distanceBetween(Point2D a, Point2D b) {
		return (float) Math.sqrt((a.x()-b.x())*(a.x()-b.x()) + (a.y()-b.y())*(a.y()-b.y()));
	}
}

