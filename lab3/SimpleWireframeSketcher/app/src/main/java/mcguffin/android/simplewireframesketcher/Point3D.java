package mcguffin.android.simplewireframesketcher;
public class Point3D {

	public float [] p = new float[3];

	public Point3D() {
		p[0] = p[1] = p[2] = 0;
	}

	public Point3D( float x, float y, float z ) {
		p[0] = x;
		p[1] = y;
		p[2] = z;
	}

	public Point3D( Vector3D V ) {
		p[0] = V.v[0];
		p[1] = V.v[1];
		p[2] = V.v[2];
	}

	public void copy( Point3D P ) {
		p[0] = P.p[0];
		p[1] = P.p[1];
		p[2] = P.p[2];
	}

	public float x() { return p[0]; }
	public float y() { return p[1]; }
	public float z() { return p[2]; }

	// used to pass coordinates directly to OpenGL routines
	public float [] get() { return p; }

	// return the difference between two given points
	static public Vector3D diff( Point3D a, Point3D b ) {
		return new Vector3D( a.x()-b.x(), a.y()-b.y(), a.z()-b.z() );
	}

	// return the sum of the given point and vector
	static public Point3D sum( Point3D a, Vector3D b ) {
		return new Point3D( a.x()+b.x(), a.y()+b.y(), a.z()+b.z() );
	}

	// return the difference between the given point and vector
	static public Point3D diff( Point3D a, Vector3D b ) {
		return new Point3D( a.x()-b.x(), a.y()-b.y(), a.z()-b.z() );
	}

	static Point3D average( Point3D a, Point3D b ) {
		// return new Point3D( Vector3D.mult( Vector3D.sum( new Vector3D(a), new Vector3D(b) ), 0.5f ) );
		return new Point3D( (a.x()+b.x())*0.5f, (a.y()+b.y())*0.5f, (a.z()+b.z())*0.5f );
	}
}
