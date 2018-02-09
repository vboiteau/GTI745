package mcguffin.android.simplewireframesketcher;

import java.lang.Math;

public class Matrix4x4 {

	public float [] m = new float[16];

	public Matrix4x4() {
		setToIdentity();
	}

	public void setToIdentity() {
		m[ 0] = 1; m[ 4] = 0; m[ 8] = 0; m[12] = 0;
		m[ 1] = 0; m[ 5] = 1; m[ 9] = 0; m[13] = 0;
		m[ 2] = 0; m[ 6] = 0; m[10] = 1; m[14] = 0;
		m[ 3] = 0; m[ 7] = 0; m[11] = 0; m[15] = 1;
	}

	public void copy( Matrix4x4 M ) {
		m[ 0] = M.m[ 0]; m[ 4] = M.m[ 4]; m[ 8] = M.m[ 8]; m[12] = M.m[12];
		m[ 1] = M.m[ 1]; m[ 5] = M.m[ 5]; m[ 9] = M.m[ 9]; m[13] = M.m[13];
		m[ 2] = M.m[ 2]; m[ 6] = M.m[ 6]; m[10] = M.m[10]; m[14] = M.m[14];
		m[ 3] = M.m[ 3]; m[ 7] = M.m[ 7]; m[11] = M.m[11]; m[15] = M.m[15];
	}

	public void setToTranslation( Vector3D v ) {
		m[ 0] = 1; m[ 4] = 0; m[ 8] = 0; m[12] = v.x();
		m[ 1] = 0; m[ 5] = 1; m[ 9] = 0; m[13] = v.y();
		m[ 2] = 0; m[ 6] = 0; m[10] = 1; m[14] = v.z();
		m[ 3] = 0; m[ 7] = 0; m[11] = 0; m[15] = 1;
	}

	public void setToRotation( float angle_in_radians, Vector3D v ) {
		// TODO XXX assert here that v is normalized
		float c = (float)Math.cos( angle_in_radians );
		float s = (float)Math.sin( angle_in_radians );
		float one_minus_c = 1-c;
		m[ 0] = c + one_minus_c * v.x()*v.x();
		m[ 5] = c + one_minus_c * v.y()*v.y();
		m[10] = c + one_minus_c * v.z()*v.z();
		m[ 1] = m[ 4] = one_minus_c * v.x()*v.y();
		m[ 2] = m[ 8] = one_minus_c * v.x()*v.z();
		m[ 6] = m[ 9] = one_minus_c * v.y()*v.z();
		float xs = v.x() * s;
		float ys = v.y() * s;
		float zs = v.z() * s;
		m[ 1] += zs;  m[ 4] -= zs;
		m[ 2] -= ys;  m[ 8] += ys;
		m[ 6] += xs;  m[ 9] -= xs;

		m[12] = 0;
		m[13] = 0;
		m[14] = 0;
		m[ 3] = 0; m[ 7] = 0; m[11] = 0; m[15] = 1;
	}

	public void setToRotation( float angle_in_radians, Vector3D v, Point3D origin ) {
		Matrix4x4 tmp = new Matrix4x4();
		tmp.setToTranslation( (new Vector3D( origin )).negated() );
		setToRotation( angle_in_radians, v );
		copy( Matrix4x4.mult( this, tmp ) );
		tmp.setToTranslation( new Vector3D( origin ) );
		copy( Matrix4x4.mult( tmp, this ) );
	}

	public void setToUniformScale( float s ) {
		m[ 0] = s; m[ 4] = 0; m[ 8] = 0; m[12] = 0;
		m[ 1] = 0; m[ 5] = s; m[ 9] = 0; m[13] = 0;
		m[ 2] = 0; m[ 6] = 0; m[10] = s; m[14] = 0;
		m[ 3] = 0; m[ 7] = 0; m[11] = 0; m[15] = 1;
	}

	public void setToUniformScale( float s, Point3D origin ) {
		Matrix4x4 tmp = new Matrix4x4();
		tmp.setToTranslation( (new Vector3D( origin )).negated() );
		setToUniformScale( s );
		copy( Matrix4x4.mult( this, tmp ) );
		tmp.setToTranslation( new Vector3D( origin ) );
		copy( Matrix4x4.mult( tmp, this ) );
	}


	public void setToLookAt(
		Point3D eye, Point3D target, Vector3D up,
		boolean inverted
	) {
		// step one: generate a rotation matrix

		Vector3D z = (Point3D.diff(eye,target)).normalized();
		Vector3D y = up;
		Vector3D x = Vector3D.cross(y,z);
		y = Vector3D.cross(z,x);

		// Cross product gives area of parallelogram, which is < 1 for
		// non-perpendicular unit-length vectors; so normalize x and y.
		x = x.normalized();
		y = y.normalized();

		Matrix4x4 m2 = new Matrix4x4();

		if ( inverted ) {
			// the rotation matrix
			m[ 0] = x.x(); m[ 4] = y.x(); m[ 8] = z.x(); m[12] = 0;
			m[ 1] = x.y(); m[ 5] = y.y(); m[ 9] = z.y(); m[13] = 0;
			m[ 2] = x.z(); m[ 6] = y.z(); m[10] = z.z(); m[14] = 0;
			m[ 3] = 0;     m[ 7] = 0;     m[11] = 0;     m[15] = 1;

			// step two: premultiply by a translation matrix
			m2.setToTranslation( new Vector3D(eye) );
			copy( Matrix4x4.mult(m2,this) );
		}
		else {
			// the rotation matrix
			m[ 0] = x.x(); m[ 4] = x.y(); m[ 8] = x.z(); m[12] = 0;
			m[ 1] = y.x(); m[ 5] = y.y(); m[ 9] = y.z(); m[13] = 0;
			m[ 2] = z.x(); m[ 6] = z.y(); m[10] = z.z(); m[14] = 0;
			m[ 3] = 0;     m[ 7] = 0;     m[11] = 0;     m[15] = 1;

			// step two: postmultiply by a translation matrix
			m2.setToTranslation( (new Vector3D(eye)).negated() );
			copy( Matrix4x4.mult(this,m2) );
		}
	}

	public void setToFrustum( float l, float r, float b, float t, float n, float f ) {
		m[ 0] = 2*n/(r-l); m[ 4] = 0;         m[ 8] = (r+l)/(r-l);  m[12] = 0;
		m[ 1] = 0;         m[ 5] = 2*n/(t-b); m[ 9] = (t+b)/(t-b);  m[13] = 0;
		m[ 2] = 0;         m[ 6] = 0;         m[10] = -(f+n)/(f-n); m[14] = -2*f*n/(f-n);
		m[ 3] = 0;         m[ 7] = 0;         m[11] = -1;           m[15] = 0;
	}

	// return the product of the given matrices
	public static Matrix4x4 mult( Matrix4x4 a, Matrix4x4 b ) {
		Matrix4x4 M = new Matrix4x4();

		M.m[ 0] = a.m[ 0]*b.m[ 0] + a.m[ 4]*b.m[ 1] + a.m[ 8]*b.m[ 2] + a.m[12]*b.m[ 3];
		M.m[ 1] = a.m[ 1]*b.m[ 0] + a.m[ 5]*b.m[ 1] + a.m[ 9]*b.m[ 2] + a.m[13]*b.m[ 3];
		M.m[ 2] = a.m[ 2]*b.m[ 0] + a.m[ 6]*b.m[ 1] + a.m[10]*b.m[ 2] + a.m[14]*b.m[ 3];
		M.m[ 3] = a.m[ 3]*b.m[ 0] + a.m[ 7]*b.m[ 1] + a.m[11]*b.m[ 2] + a.m[15]*b.m[ 3];

		M.m[ 4] = a.m[ 0]*b.m[ 4] + a.m[ 4]*b.m[ 5] + a.m[ 8]*b.m[ 6] + a.m[12]*b.m[ 7];
		M.m[ 5] = a.m[ 1]*b.m[ 4] + a.m[ 5]*b.m[ 5] + a.m[ 9]*b.m[ 6] + a.m[13]*b.m[ 7];
		M.m[ 6] = a.m[ 2]*b.m[ 4] + a.m[ 6]*b.m[ 5] + a.m[10]*b.m[ 6] + a.m[14]*b.m[ 7];
		M.m[ 7] = a.m[ 3]*b.m[ 4] + a.m[ 7]*b.m[ 5] + a.m[11]*b.m[ 6] + a.m[15]*b.m[ 7];

		M.m[ 8] = a.m[ 0]*b.m[ 8] + a.m[ 4]*b.m[ 9] + a.m[ 8]*b.m[10] + a.m[12]*b.m[11];
		M.m[ 9] = a.m[ 1]*b.m[ 8] + a.m[ 5]*b.m[ 9] + a.m[ 9]*b.m[10] + a.m[13]*b.m[11];
		M.m[10] = a.m[ 2]*b.m[ 8] + a.m[ 6]*b.m[ 9] + a.m[10]*b.m[10] + a.m[14]*b.m[11];
		M.m[11] = a.m[ 3]*b.m[ 8] + a.m[ 7]*b.m[ 9] + a.m[11]*b.m[10] + a.m[15]*b.m[11];

		M.m[12] = a.m[ 0]*b.m[12] + a.m[ 4]*b.m[13] + a.m[ 8]*b.m[14] + a.m[12]*b.m[15];
		M.m[13] = a.m[ 1]*b.m[12] + a.m[ 5]*b.m[13] + a.m[ 9]*b.m[14] + a.m[13]*b.m[15];
		M.m[14] = a.m[ 2]*b.m[12] + a.m[ 6]*b.m[13] + a.m[10]*b.m[14] + a.m[14]*b.m[15];
		M.m[15] = a.m[ 3]*b.m[12] + a.m[ 7]*b.m[13] + a.m[11]*b.m[14] + a.m[15]*b.m[15];

		return M;
	}

	// return the product of the given matrix and vector
	public static Vector3D mult( Matrix4x4 a, Vector3D b ) {
		// We treat the vector as if
		// its (homogeneous) 4th component were zero.
		return new Vector3D(
			a.m[ 0]*b.x() + a.m[ 4]*b.y() + a.m[ 8]*b.z(), // + a.m[12]*b.w(),
			a.m[ 1]*b.x() + a.m[ 5]*b.y() + a.m[ 9]*b.z(), // + a.m[13]*b.w(),
			a.m[ 2]*b.x() + a.m[ 6]*b.y() + a.m[10]*b.z()  // + a.m[14]*b.w(),
			// a.m[ 3]*b.x() + a.m[ 7]*b.y() + a.m[11]*b.z() + a.m[15]*b.w()
		);
	}

	// return the product of the given matrix and point
	// TODO check that this will work okay, even if the matrix is a product of a uniform scale and a rotation, each around the same centre
	public static Point3D mult( Matrix4x4 a, Point3D b ) {
		// We treat the point as if
		// its (homogeneous) 4th component were one.
		return new Point3D(
			a.m[ 0]*b.x() + a.m[ 4]*b.y() + a.m[ 8]*b.z() + a.m[12],
			a.m[ 1]*b.x() + a.m[ 5]*b.y() + a.m[ 9]*b.z() + a.m[13],
			a.m[ 2]*b.x() + a.m[ 6]*b.y() + a.m[10]*b.z() + a.m[14]
		);
	}

}
