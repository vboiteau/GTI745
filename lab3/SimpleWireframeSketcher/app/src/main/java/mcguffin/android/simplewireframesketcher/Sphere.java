package mcguffin.android.simplewireframesketcher;

import java.lang.Math;

public class Sphere {
	public Point3D center = new Point3D();
	public float radiusSquared;

	public Sphere() { }
	public Sphere( Point3D c, float radius ) {
		center.copy( c );
		radiusSquared = radius * radius;
	}

	public boolean intersects(
		Ray3D ray, // input
		Point3D intersection, // output
		boolean allowIntersectionEvenIfRayOriginatesInsideSphere
	) {
		// Consider a line of the form Q+v*t, where t is real
		Point3D Q = ray.origin;
		Vector3D v = ray.direction;

		// the sphere's center
		Point3D P = center;

		// Reference: Foley et al., "Computer Graphics: Principles and Practice",
		// 2nd edition, 1990, page 1101
		Vector3D Q_minus_P = Point3D.diff( Q, P );
		double b = 2*Vector3D.dot(v,Q_minus_P);
		double c = Q_minus_P.lengthSquared() - radiusSquared;

		// Consider the quadratic equation
		//   t^2 + b*t + c = 0
		// If there are real roots, then the line intersects the sphere.
		// If there are *positive* roots, the the *ray* intersects the sphere.
		double determinant = b*b - 4*c;
		if ( determinant >= 0 ) {
			// Reference: Press et al., "Numerical Recipes in C", 2nd edition, 1992, page 184
			double q = -0.5*( b+(b>0?1:-1)*Math.sqrt(determinant) );
			double t1 = q;
			double t2 = c/q;
			if ( t1 >= 0 && t2 >= 0 ) {
				intersection.copy( ray.point( (float)(t1 < t2 ? t1 : t2) ) );
				return true;
			}
			else {
				// At least one of the intersection points has a negative t value.
				// This implies that either there's no intersection between the
				// ray and sphere, or the origin of the ray is inside the sphere.
				if ( allowIntersectionEvenIfRayOriginatesInsideSphere ) {
					if ( t1 >= 0 ) {
						intersection.copy( ray.point( (float)t1 ) );
						return true;
					}
					else if ( t2 >= 0 ) {
						intersection.copy( ray.point( (float)t2 ) );
						return true;
					}
				}
			}
		}
		return false;
	}
}
