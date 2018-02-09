package mcguffin.android.simplewireframesketcher;

import java.lang.Math;

public class Vector3D {

	public float [] v = new float[3];

	public Vector3D() {
		v[0] = v[1] = v[2] = 0;
	}

	public Vector3D( float x, float y, float z ) {
		copy( x, y, z );
	}

	public Vector3D( Point3D P ) {
		v[0] = P.p[0];
		v[1] = P.p[1];
		v[2] = P.p[2];
	}

	public void copy( float x, float y, float z ) {
		v[0] = x;
		v[1] = y;
		v[2] = z;
	}

	public void copy( Vector3D V ) {
		v[0] = V.v[0];
		v[1] = V.v[1];
		v[2] = V.v[2];
	}

	public float x() { return v[0]; }
	public float y() { return v[1]; }
	public float z() { return v[2]; }

	public float lengthSquared() {
		return x()*x() + y()*y() + z()*z();
	}
	public float length() {
		return (float)Math.sqrt( lengthSquared() );
	}

	public Vector3D negated() {
		return new Vector3D(-x(),-y(),-z());
	}

	public Vector3D normalized() {
		float l = length();
		if ( l > 0 ) {
			float k = 1/l; // scale factor
			return new Vector3D(k*x(),k*y(),k*z());
		}
		else return new Vector3D(x(),y(),z());
	}

	Vector3D choosePerpendicular() {
		// strategy: pick the two largest components,
		// permute them and negate one of them, and
		// replace the other (i.e. smallest) component with zero.

		float X = Math.abs(x());
		float Y = Math.abs(x());
		float Z = Math.abs(x());

		Vector3D v;
		if ( X < Y ) {
			if ( Y < Z ) {
				// X < Y < Z
				v = new Vector3D( 0, z(), -y() );
			}
			else if ( X < Z ) {
				// X < Z <= Y
				v = new Vector3D( 0, z(), -y() );
			}
			else {
				// Z <= X < Y
				v = new Vector3D( y(), -x(), 0 );
			}
		}
		else {
			if ( Z < Y ) {
				// Z < Y <= X
				v = new Vector3D( y(), -x(), 0 );
			}
			else if ( Z < X ) {
				// Y <= Z < X
				v = new Vector3D( z(), 0, -x() );
			}
			else {
				// Y <= X <= Z
				v = new Vector3D( z(), 0, -x() );
			}
		}

		return v;

	}

	public int indexOfGreatestComponent() {
		float X = (float)Math.abs( x() );
		float Y = (float)Math.abs( y() );
		float Z = (float)Math.abs( z() );
		if ( Y >= Z ) {
			return X >= Y ? 0 : 1;
		}
		else {
			return X >= Z ? 0 : 2;
		}
	}

	// returns the dot-product of the given vectors
	static public float dot( Vector3D a, Vector3D b ) {
		return a.x()*b.x() + a.y()*b.y() + a.z()*b.z();
	}

	// returns the cross-product of the given vectors
	static public Vector3D cross( Vector3D a, Vector3D b ) {
		return new Vector3D(
			a.y()*b.z() - a.z()*b.y(),
			a.z()*b.x() - a.x()*b.z(),
			a.x()*b.y() - a.y()*b.x()
		);
	}

	// returns the sum of the given vectors
	static public Vector3D sum( Vector3D a, Vector3D b ) {
		return new Vector3D( a.x()+b.x(), a.y()+b.y(), a.z()+b.z() );
	}

	// returns the difference of the given vectors
	static public Vector3D diff( Vector3D a, Vector3D b ) {
		return new Vector3D( a.x()-b.x(), a.y()-b.y(), a.z()-b.z() );
	}

	// returns the product of the given vector and scalar
	static public Vector3D mult( Vector3D a, float b ) {
		return new Vector3D( a.x()*b, a.y()*b, a.z()*b );
	}

	// Returns the angle, in [-pi,pi], between the two given vectors,
	// and whose sign corresponds to the right-handed rotation around
	// the given axis to get from v1 to v2.
	static public float computeSignedAngle( Vector3D v1, Vector3D v2, Vector3D axisOfRotation ) {

		Vector3D crossProduct = Vector3D.cross( v1.normalized(), v2.normalized() );

		// Due to numerical inaccuracies, the length of the cross product
		// may be slightly more than 1.
		// Calling arcsin on such a value would result in NaN.
		float lengthOfCross = crossProduct.length();
		float angle = ( lengthOfCross >= 1 ) ? (float)Math.PI/2 : (float)Math.asin( lengthOfCross );

		if ( Vector3D.dot( v1, v2 ) < 0 )
			angle = (float)Math.PI - angle;
		if ( Vector3D.dot( crossProduct, axisOfRotation ) < 0 ) angle = -angle;
		return angle;
	}

}
