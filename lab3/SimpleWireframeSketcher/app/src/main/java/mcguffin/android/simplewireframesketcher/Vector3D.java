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

    // return the normal of the given vector
    static public float norm2( Vector3D v ) {
	    return v.x() * v.x() + v.y() * v.y() + v.z() * v.z();
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

    static public boolean detectedAnIntersection2D(Point2D p0, Point2D p1, Point2D p2, Point2D p3) {
        float seg1x = p1.x() - p0.x();
        float seg1y = p1.y() - p0.y();
        float seg2x = p3.x() - p2.x();
        float seg2y = p3.y() - p2.y();

        float s = (-seg1y * (p0.x() - p2.x()) + seg1x * (p0.y() - p2.y())) / (-seg2x * seg1y + seg1x * seg2y);
        float t = ( seg2x * (p0.y() - p2.y()) - seg2y * (p0.x() - p2.x())) / (-seg2x * seg1y + seg1x * seg2y);

        // We have an intersection
        if (s >= 0 && s <= 1 && t >= 0 && t <= 1)
        {
            return true;
        }

        return false; // No intersection detected,
    }

    static public boolean detectedAnIntersection3D(Point3D p0, Point3D p1, Point3D p2, Point3D p3) {
        Vector3D vec1 = Point3D.diff(p1, p0);
        Vector3D vec2 = Point3D.diff(p3, p2);
        Vector3D vec3 = Point3D.diff(p2, p0);

        float s = dot(cross(vec3, vec2), cross(vec1, vec2)) / norm2(cross(vec1, vec2));
        float t = dot(cross(vec3, vec1), cross(vec1, vec2)) / norm2(cross(vec1, vec2));

        // We have an intersection
        if ((s >= 0 && s <= 1) && (t >= 0 && t <= 1))
        {
            return true;
        }

        return false; // No intersection detected,
    }
}
