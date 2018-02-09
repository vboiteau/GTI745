package mcguffin.android.simplewireframesketcher;


public class Ray3D {
	public Point3D origin = new Point3D();
	public Vector3D direction = new Vector3D();

	public Ray3D() { }
	public Ray3D(Point3D o, Vector3D d) {
		origin.copy( o );
		direction.copy( d.normalized() );
	}

	public Point3D point( float t ) {
		return Point3D.sum(origin, Vector3D.mult(direction,t));
	}
}

