
package mcguffin.android.simplewireframesketcher;



import android.graphics.Paint;
//import android.graphics.Paint.Style;
import android.graphics.Canvas;
import android.graphics.Path;
import android.graphics.Matrix;
import android.graphics.Rect;
import android.graphics.Bitmap;
import android.util.Log;

import java.lang.Math;
import java.util.ArrayList;
//import java.awt.Color;


class GraphicsWrapper {

	Matrix originalMatrix = null;

	private int windowWidthInPixels = 128;
	private int windowHeightInPixels = 128;
	boolean areInitialWindowDimensionsKnown = false;
	//boolean hasGLViewportBeenEverCalled = false; // not needed in this implementation of GraphicsWrapper, but added here to ease the later porting of some changes in this implementation to the JOGL implementation of GraphicsWrapper

	AlignedRectangle2D rectangleToFrameInitially = null;
	boolean isRectangleToFrameStoredForInitializationLater = false;


	public int getWidth() { return windowWidthInPixels; }
	public int getHeight() { return windowHeightInPixels; }


	private Paint paint = null;
	private Canvas canvas = null;
	private Rect rect = new Rect();
	private Path path = new Path();

	public void set( Paint p, Canvas c ) {
		assert p != null && c != null;
		boolean firstTimeThisMethodCalled = ( paint == null || canvas == null );
		this.paint = p;
		this.canvas = c;
		this.originalMatrix = c.getMatrix();

		resize( c.getWidth(), c.getHeight() );

		if ( firstTimeThisMethodCalled ) {
			if ( isFontHeightStoredForInitializationLater ) {
				paint.setTextSize( fontHeight );
				isFontHeightStoredForInitializationLater = false;
			}
			//if ( areInitialWindowDimensionsKnown && !hasGLViewportBeenEverCalled ) {
			//	glViewport( ... );
			//	hasGLViewportBeenEverCalled = true;
			//}
		}
	}




	private int fontHeight = 14;
	boolean isFontHeightStoredForInitializationLater = false;
	public void setFontHeight( int h ) {
		fontHeight = h;
		if ( paint != null && canvas != null ) {
			paint.setTextSize( fontHeight );
			isFontHeightStoredForInitializationLater = false;
		}
		else {
			isFontHeightStoredForInitializationLater = true;
		}
	}
	public int getFontHeight() {
		return fontHeight;
	}









	private float offsetXInPixels = 0;
	private float offsetYInPixels = 0;
	private float scaleFactorInWorldSpaceUnitsPerPixel = 1.0f; // greater if user is more zoomed out

	public float convertPixelsToWorldSpaceUnitsX( float XInPixels ) { return ( XInPixels - offsetXInPixels )*scaleFactorInWorldSpaceUnitsPerPixel; }
	public float convertPixelsToWorldSpaceUnitsY( float YInPixels ) { return ( YInPixels - offsetYInPixels )*scaleFactorInWorldSpaceUnitsPerPixel; }
	public Point2D convertPixelsToWorldSpaceUnits( Point2D p ) { return new Point2D(convertPixelsToWorldSpaceUnitsX(p.x()),convertPixelsToWorldSpaceUnitsY(p.y())); }

	public int convertWorldSpaceUnitsToPixelsX( float x ) { return Math.round( x / scaleFactorInWorldSpaceUnitsPerPixel + offsetXInPixels ); }
	public int convertWorldSpaceUnitsToPixelsY( float y ) { return Math.round( y / scaleFactorInWorldSpaceUnitsPerPixel + offsetYInPixels ); }
	public Point2D convertWorldSpaceUnitsToPixels( Point2D p ) { return new Point2D(convertWorldSpaceUnitsToPixelsX(p.x()),convertWorldSpaceUnitsToPixelsY(p.y())); }

	public float getScaleFactorInWorldSpaceUnitsPerPixel() { return scaleFactorInWorldSpaceUnitsPerPixel; }

	public void pan( float dx, float dy ) {
		offsetXInPixels += dx;
		offsetYInPixels += dy;
	}
	public void zoomIn(
		float zoomFactor, // greater than 1 to zoom in, between 0 and 1 to zoom out
		float centerXInPixels,
		float centerYInPixels
	) {
		scaleFactorInWorldSpaceUnitsPerPixel /= zoomFactor;
		offsetXInPixels = centerXInPixels - (centerXInPixels - offsetXInPixels) * zoomFactor;
		offsetYInPixels = centerYInPixels - (centerYInPixels - offsetYInPixels) * zoomFactor;
	}
	public void zoomIn(
		float zoomFactor // greater than 1 to zoom in, between 0 and 1 to zoom out
	) {
		zoomIn( zoomFactor, windowWidthInPixels * 0.5f, windowHeightInPixels * 0.5f );
	}

	// This can be used to implement bimanual (2-handed) camera control,
	// or 2-finger camera control, as in a "pinch" gesture
	public void panAndZoomBasedOnDisplacementOfTwoPoints(
		// these are assumed to be in pixel coordinates
		Point2D A_old, Point2D B_old,
		Point2D A_new, Point2D B_new
	) {
		// Compute midpoints of each pair of points
		Point2D M1 = Point2D.average( A_old, B_old );
		Point2D M2 = Point2D.average( A_new, B_new );

		// This is the translation that the world should appear to undergo.
		Vector2D translation = Point2D.diff( M2, M1 );

		// Compute a vector associated with each pair of points.
		Vector2D v1 = Point2D.diff( A_old, B_old );
		Vector2D v2 = Point2D.diff( A_new, B_new );

		float v1_length = v1.length();
		float v2_length = v2.length();
		float scaleFactor = 1;
		if ( v1_length > 0 && v2_length > 0 )
			scaleFactor = v2_length / v1_length;
		pan( translation.x(), translation.y() );
		zoomIn( scaleFactor, M2.x(), M2.y() );
	}

	public void frame(
		AlignedRectangle2D rect,
		boolean expand // true if caller wants a margin of whitespace added around the rect
	) {
		if ( rect.isEmpty() || rect.getDiagonal().x() == 0 || rect.getDiagonal().y() == 0 ) {
			return;
		}
		if ( expand ) {
			float diagonal = rect.getDiagonal().length() / 20;
			Vector2D v = new Vector2D( diagonal, diagonal );
			rect = new AlignedRectangle2D( Point2D.diff(rect.getMin(),v), Point2D.sum(rect.getMax(),v) );
		}

		if ( ! areInitialWindowDimensionsKnown ) {
			rectangleToFrameInitially = new AlignedRectangle2D( rect );
			isRectangleToFrameStoredForInitializationLater = true;
		}
		else {
			assert windowWidthInPixels > 0 && windowHeightInPixels > 0;

			if ( rect.getDiagonal().x() / rect.getDiagonal().y() >= windowWidthInPixels / (float)windowHeightInPixels ) {
				offsetXInPixels = - rect.getMin().x() * windowWidthInPixels / rect.getDiagonal().x();
				scaleFactorInWorldSpaceUnitsPerPixel = rect.getDiagonal().x() / windowWidthInPixels;
				offsetYInPixels = windowHeightInPixels/2 - rect.getCenter().y() / scaleFactorInWorldSpaceUnitsPerPixel;
			}
			else {
				offsetYInPixels = - rect.getMin().y() * windowHeightInPixels / rect.getDiagonal().y();
				scaleFactorInWorldSpaceUnitsPerPixel = rect.getDiagonal().y() / windowHeightInPixels;
				offsetXInPixels = windowWidthInPixels/2 - rect.getCenter().x() / scaleFactorInWorldSpaceUnitsPerPixel;
			}
		}
	}


	private void setInitialWindowDimensions( int w, int h ) {
		assert ! areInitialWindowDimensionsKnown;
		windowWidthInPixels = w;
		windowHeightInPixels = h;
		areInitialWindowDimensionsKnown = true;
		if ( isRectangleToFrameStoredForInitializationLater ) {
			isRectangleToFrameStoredForInitializationLater = false;
			frame( rectangleToFrameInitially, false );
			rectangleToFrameInitially = null;
		}
		//if ( paint != null && canvas != null && !hasGLViewportBeenEverCalled ) {
		//	glViewport(...);
		//	hasGLViewportBeenEverCalled = true;
		//}
	}


	public void resize( int w, int h ) {
		if ( ! areInitialWindowDimensionsKnown ) {
			setInitialWindowDimensions( w, h );
		}
		else if ( w!=windowWidthInPixels || h!=windowHeightInPixels ) {
			Point2D oldCenter = convertPixelsToWorldSpaceUnits( new Point2D(
				windowWidthInPixels * 0.5f, windowHeightInPixels * 0.5f
			) );
			float radius = Math.min( windowWidthInPixels, windowHeightInPixels ) * 0.5f * scaleFactorInWorldSpaceUnitsPerPixel;


			windowWidthInPixels = w;
			windowHeightInPixels = h;

			if ( radius > 0 ) {
				frame(
					new AlignedRectangle2D(
						new Point2D( oldCenter.x() - radius, oldCenter.y() - radius ),
						new Point2D( oldCenter.x() + radius, oldCenter.y() + radius )
					),
					false
				);
			}
		}
	}

	public void setCoordinateSystemToPixels() {
		canvas.setMatrix( originalMatrix );
	}

	public void setCoordinateSystemToWorldSpaceUnits() {
		canvas.setMatrix( originalMatrix );
		canvas.translate( offsetXInPixels, offsetYInPixels );
		float s = 1.0f/scaleFactorInWorldSpaceUnitsPerPixel;
		canvas.scale( s, s );
	}

	public void clear( float r, float g, float b ) {
		canvas.drawRGB( (int)(r*255), (int)(g*255), (int)(b*255) );
	}

	public void setupForDrawing() {
	}

	public void enableAlphaBlending() {
	}

	public void disableAlphaBlending() {
	}

	public void setColor( float r, float g, float b ) {
		paint.setARGB( 255, (int)(r*255), (int)(g*255), (int)(b*255) );
	}

	public void setColor( float r, float g, float b, float alpha ) {
		paint.setARGB( (int)(alpha*255), (int)(r*255), (int)(g*255), (int)(b*255) );
	}

	public void setLineWidth( float width ) {
		paint.setStrokeWidth( width );
	}

	public void drawLine( float x1, float y1, float x2, float y2 ) {
		canvas.drawLine( x1, y1, x2, y2, paint );
	}

	public void drawPolyline( ArrayList< Point2D > points, boolean isClosed, boolean isFilled ) {
		if ( points.size() <= 1 )
			return;

		path.reset();
		Point2D p = points.get(0);
		path.moveTo( p.x(), p.y() );
		for ( int i = 1; i < points.size(); ++i ) {
			p = points.get(i);
			path.lineTo( p.x(), p.y() );
		}
		if ( isClosed )
			path.close();

		paint.setStyle( isFilled ? Paint.Style.FILL : Paint.Style.STROKE );
		// TODO-3 or should i call path.setFillType() ?
		canvas.drawPath( path, paint );

		// Trying advice in
		// http://stackoverflow.com/questions/15039829/drawing-paths-and-hardware-acceleration
		// TODO-3: I tried this change (using drawLines() instead of drawPath),
		// and it indeed is faster (on Cintiq Companion) for large ink strokes,
		// but it also looks ugly and fails to draw filled-in regions.
		//
		/*
		float [] tempArray = new float[ points.size() * 4 ];
		Point2D p0 = null, p1 = points.get(0);
		for ( int i = 0; i < points.size() - 1; ++i ) {
			p0 = p1;
			p1 = points.get(i+1);
			tempArray[i*4  ] = p0.x();
			tempArray[i*4+1] = p0.y();
			tempArray[i*4+2] = p1.x();
			tempArray[i*4+3] = p1.y();
		}
		canvas.drawLines( tempArray, paint );
		*/
	}

	public void drawPolyline( ArrayList< Point2D > points ) {
		drawPolyline( points, false, false );
	}
	public void drawPolyline(ArrayList< Point2D > points, float stroke ){ paint.setStrokeWidth(stroke); drawPolyline(points, false, false);}
	public void drawPolygon( ArrayList< Point2D > points ) {
		drawPolyline( points, true, false );
	}
	public void fillPolygon( ArrayList< Point2D > points ) {
		drawPolyline( points, true, true );
	}

	public void drawRect( float x, float y, float w, float h, boolean isFilled ) {
		paint.setStyle( isFilled ? Paint.Style.FILL : Paint.Style.STROKE );
		if ( w < 0 ) { x=x+w; w=-w; }
		if ( h < 0 ) { y=y+h; h=-h; }
		canvas.drawRect( x, y, x+w, y+h, paint );
	}

	public void drawRect( float x, float y, float w, float h ) {
		drawRect( x, y, w, h, false );
	}

	public void fillRect( float x, float y, float w, float h ) {
		drawRect( x, y, w, h, true );
	}

	public void drawCircle( float x, float y, float radius, boolean isFilled ) {
		paint.setStyle( isFilled ? Paint.Style.FILL : Paint.Style.STROKE );
		canvas.drawCircle( x, y, radius, paint );
	}

	public void drawCircle( float x, float y, float radius ) {
		drawCircle( x, y, radius, false );
	}

	public void fillCircle( float x, float y, float radius ) {
		drawCircle( x, y, radius, true );
	}

	public void drawCenteredCircle( float x, float y, float radius, boolean isFilled ) {
		x -= radius;
		y -= radius;
		drawCircle( x, y, radius, isFilled );
	}

	public void drawArc(
		float center_x, // increases right
		float center_y, // increases down
		float radius,
		float startAngle, // in radians; zero for right, increasing counterclockwise
		float angleExtent, // in radians; positive for counterclockwise
		boolean isFilled
	) {
		// TODO-3
	}

	public void drawArc(
		float center_x, float center_y, float radius,
		float startAngle, // in radians
		float angleExtent // in radians
	) {
		drawArc( center_x, center_y, radius, startAngle, angleExtent, false );
	}

	public void fillArc(
		float center_x, float center_y, float radius,
		float startAngle, // in radians
		float angleExtent // in radians
	) {
		drawArc( center_x, center_y, radius, startAngle, angleExtent, true );
	}



	// returns the width of a string
	public float stringWidth( String s ) {
		if ( s == null || s.length() == 0 ) return 0;

		paint.getTextBounds( s, 0, s.length(), rect );
		return rect.width();
	}


	public void drawString(
		float x, float y,      // lower left corner of the string
		String s           // the string
	) {
		if ( s == null || s.length() == 0 ) return;
		paint.setStyle( Paint.Style.FILL );
		canvas.drawText( s, x, y, paint );
	}

	public void drawBitmap( Bitmap bitmap, float left, float top ) {
		canvas.drawBitmap( bitmap, left, top, paint);
	}

}



